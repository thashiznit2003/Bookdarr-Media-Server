/* BMS Service Worker
 *
 * Goals:
 * - Provide device-side offline caching for checked-out books (My Library).
 * - Keep behavior explicit: we only cache media when instructed by the app.
 * - Support progress events back to the UI.
 *
 * Note: this is best-effort for browsers. iOS may purge Cache Storage.
 */

// Bump when cache key semantics change (e.g. relative vs absolute URLs).
const CACHE_VERSION = 2;
const CACHE_NAME = `bms-offline-v${CACHE_VERSION}`;
const APP_SHELL_CACHE = `bms-shell-v${CACHE_VERSION}`;

const DB_NAME = "bms-offline-db";
// Bump when IndexedDB schema/semantics change.
const DB_VERSION = 3;
const STORE_BOOKS = "books";
const STORE_URLS = "urls";

const MSG_CACHE_BOOK = "CACHE_BOOK";
const MSG_CLEAR_BOOK = "CLEAR_BOOK";
const MSG_CLEAR_ALL = "CLEAR_ALL";
const MSG_QUERY_BOOKS = "QUERY_BOOKS";

const OUT_PROGRESS = "OFFLINE_PROGRESS";
const OUT_STATUS = "OFFLINE_STATUS";

// One active book download at a time, queued FIFO. This avoids saturating the network
// and keeps memory pressure low on mobile browsers.
const activeDownloads = new Map(); // bookId -> AbortController
const bookQueue = []; // bookId[]
const queuedBooks = new Set(); // bookId
let processingQueue = false;

const AUDIO_CHUNK_THRESHOLD_BYTES = 25 * 1024 * 1024;
// Bigger chunks reduce per-request overhead (TLS + headers) while still being safe on memory.
const AUDIO_CHUNK_SIZE_BYTES = 10 * 1024 * 1024;
// Parallel chunk downloads dramatically increase throughput on LAN while keeping
// memory bounded and avoiding too many concurrent TCP streams on mobile.
const AUDIO_CHUNK_CONCURRENCY = 4;

async function refreshAuth(signal) {
  try {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: "{}",
      signal,
    });
    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

async function fetchWithAuthRetry(url, init, signal) {
  const merged = { ...(init || {}), credentials: "include", cache: "no-store", signal };
  const res = await fetch(url, merged);
  if (res && res.status === 401) {
    const refreshed = await refreshAuth(signal);
    if (refreshed) {
      return fetch(url, merged);
    }
  }
  return res;
}

function toAbsoluteUrl(url) {
  try {
    return new URL(String(url), self.location.origin).toString();
  } catch {
    return String(url);
  }
}

function parseRangeHeader(rangeHeader, total) {
  if (!rangeHeader || typeof rangeHeader !== "string") return null;
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;
  const startRaw = match[1];
  const endRaw = match[2];
  let start = startRaw ? Number.parseInt(startRaw, 10) : NaN;
  let end = endRaw ? Number.parseInt(endRaw, 10) : NaN;

  if (Number.isNaN(start)) {
    if (Number.isNaN(end)) return null;
    start = Math.max(total - end, 0);
    end = total - 1;
  } else if (Number.isNaN(end)) {
    end = total - 1;
  }

  if (start < 0 || end < start || start >= total) return null;
  end = Math.min(end, total - 1);
  return { start, end };
}

function buildChunkUrl(baseUrl, chunkIndex, chunkSize) {
  const u = new URL(stripHash(baseUrl), self.location.origin);
  u.searchParams.set("bms_chunk", String(chunkIndex));
  u.searchParams.set("bms_chunk_size", String(chunkSize));
  return u.toString();
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Schema/semantic upgrade: clear prior records so we don't mix relative/absolute URLs.
      try {
        if (db.objectStoreNames.contains(STORE_BOOKS)) db.deleteObjectStore(STORE_BOOKS);
      } catch {}
      try {
        if (db.objectStoreNames.contains(STORE_URLS)) db.deleteObjectStore(STORE_URLS);
      } catch {}
      db.createObjectStore(STORE_BOOKS, { keyPath: "bookId" });
      db.createObjectStore(STORE_URLS, { keyPath: "url" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(bookId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readonly");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.get(String(bookId));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(bookId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.delete(String(bookId));
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_BOOKS, STORE_URLS], "readwrite");
    const storeBooks = tx.objectStore(STORE_BOOKS);
    const storeUrls = tx.objectStore(STORE_URLS);
    let ok = 0;
    const finish = () => {
      ok += 1;
      if (ok >= 2) resolve(true);
    };
    const a = storeBooks.clear();
    const b = storeUrls.clear();
    a.onsuccess = finish;
    b.onsuccess = finish;
    a.onerror = () => reject(a.error);
    b.onerror = () => reject(b.error);
  });
}

async function dbUrlGet(url) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_URLS, "readonly");
    const store = tx.objectStore(STORE_URLS);
    const req = store.get(String(url));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbUrlPut(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_URLS, "readwrite");
    const store = tx.objectStore(STORE_URLS);
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbUrlDelete(url) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_URLS, "readwrite");
    const store = tx.objectStore(STORE_URLS);
    const req = store.delete(String(url));
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function postToAllClients(payload) {
  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => {
      for (const client of clients) {
        try {
          client.postMessage(payload);
        } catch {
          // ignore
        }
      }
    })
    .catch(() => {});
}

async function cacheShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  // App shell is best-effort: only cache what exists.
  const urls = [
    "/",
    "/vendor/epub/epub.min.js",
    "/vendor/jszip/jszip.min.js",
    "/vendor/pdfjs/pdf.mjs",
    "/vendor/pdfjs/pdf.worker.mjs",
  ];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { credentials: "include", cache: "no-store" });
        if (res.ok) {
          await cache.put(url, res);
        }
      } catch {
        // ignore
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await cacheShell();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith("bms-shell-") && key !== APP_SHELL_CACHE) return caches.delete(key);
          if (key.startsWith("bms-offline-v") && key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve(false);
        }),
      );
      await self.clients.claim();
    })(),
  );
});

function isStreamUrl(url) {
  try {
    const u = new URL(url, self.location.origin);
    return u.pathname.startsWith("/library/files/") && u.pathname.includes("/stream");
  } catch {
    return false;
  }
}

function stripHash(url) {
  try {
    const u = new URL(url, self.location.origin);
    u.hash = "";
    return u.toString();
  } catch {
    return toAbsoluteUrl(url);
  }
}

async function resolveTotalBytes(normalizedUrl, expectedBytes, signal) {
  if (expectedBytes && expectedBytes > 0) return expectedBytes;

  try {
    const head = await fetchWithAuthRetry(
      normalizedUrl,
      {
      method: "HEAD",
      },
      signal,
    );
    if (head && head.ok) {
      const len = head.headers.get("content-length");
      if (len && !Number.isNaN(Number(len))) return Number(len);
    }
  } catch {
    // ignore
  }

  try {
    const probe = await fetchWithAuthRetry(
      normalizedUrl,
      {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      },
      signal,
    );
    const cr = probe.headers.get("content-range") || "";
    const match = cr.match(/bytes\s+\d+-\d+\/(\d+)/i);
    if (match && match[1]) {
      const total = Number.parseInt(match[1], 10);
      if (!Number.isNaN(total) && total > 0) return total;
    }
  } catch {
    // ignore
  }

  return 0;
}

async function cacheUrlChunked(url, opts) {
  const cache = await caches.open(CACHE_NAME);
  const normalizedUrl = stripHash(url);
  const expectedBytes = opts && typeof opts.bytesTotal === "number" ? opts.bytesTotal : 0;
  const bookId = opts && opts.bookId != null ? String(opts.bookId) : null;
  const fileId = opts && opts.fileId != null ? String(opts.fileId) : null;
  const mediaType = opts && typeof opts.mediaType === "string" ? opts.mediaType : null;
  const chunkSize =
    opts && typeof opts.chunkSize === "number" && opts.chunkSize > 0
      ? opts.chunkSize
      : AUDIO_CHUNK_SIZE_BYTES;
  const onProgress = opts && typeof opts.onProgress === "function" ? opts.onProgress : null;

  const controller = new AbortController();
  if (bookId) {
    const prior = activeDownloads.get(bookId);
    if (prior) {
      try {
        prior.abort();
      } catch {
        // ignore
      }
    }
    activeDownloads.set(bookId, controller);
  }

  const total = await resolveTotalBytes(normalizedUrl, expectedBytes, controller.signal);
  if (!total || total <= 0) {
    throw new Error("Unable to determine content length for chunked caching.");
  }

  const chunks = Math.ceil(total / chunkSize);
  let downloaded = 0;
  let contentType = null;

  let next = 0;
  const worker = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const i = next;
      next += 1;
      if (i >= chunks) return;

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, total - 1);
      const chunkUrl = buildChunkUrl(normalizedUrl, i, chunkSize);

      try {
        const hit = await cache.match(chunkUrl);
        if (hit) {
          downloaded += end - start + 1;
          if (onProgress) onProgress(downloaded, total);
          continue;
        }
      } catch {
        // ignore
      }

      let res;
      try {
        res = await fetchWithAuthRetry(
          normalizedUrl,
          {
            method: "GET",
            headers: { Range: `bytes=${start}-${end}` },
          },
          controller.signal,
        );
      } catch (err) {
        try {
          controller.abort();
        } catch {
          // ignore
        }
        throw err;
      }

      if (!res || !res.ok) {
        try {
          controller.abort();
        } catch {
          // ignore
        }
        throw new Error(`Chunk fetch failed (${res ? res.status : "no_response"})`);
      }
      if (!contentType) {
        contentType = res.headers.get("content-type");
      }
      const buf = await res.arrayBuffer();
      downloaded += buf.byteLength;
      if (onProgress) onProgress(downloaded, total);

      const headers = new Headers();
      if (contentType) headers.set("content-type", contentType);
      headers.set("content-length", String(buf.byteLength));
      headers.set("x-bms-chunk", String(i));
      headers.set("x-bms-chunk-size", String(chunkSize));
      headers.set("x-bms-total-bytes", String(total));
      await cache.put(chunkUrl, new Response(buf, { status: 200, headers }));
    }
  };

  const concurrency = Math.min(Math.max(AUDIO_CHUNK_CONCURRENCY, 1), chunks);
  await Promise.all(Array.from({ length: concurrency }).map(() => worker()));

  await dbUrlPut({
    url: normalizedUrl,
    bookId,
    fileId,
    mediaType,
    chunked: true,
    chunkSize,
    bytesTotal: total,
    contentType: contentType || null,
    updatedAt: Date.now(),
  });

  postToAllClients({
    type: OUT_STATUS,
    bookId,
    fileId,
    mediaType,
    url: normalizedUrl,
    status: "ready",
  });
}

async function cacheUrl(url, opts) {
  const cache = await caches.open(CACHE_NAME);
  const normalizedUrl = stripHash(url);
  const expectedBytes = opts && typeof opts.bytesTotal === "number" ? opts.bytesTotal : 0;
  const bookId = opts && opts.bookId != null ? String(opts.bookId) : null;
  const fileId = opts && opts.fileId != null ? String(opts.fileId) : null;
  const mediaType = opts && typeof opts.mediaType === "string" ? opts.mediaType : null;
  const onProgress = opts && typeof opts.onProgress === "function" ? opts.onProgress : null;

  const controller = new AbortController();
  if (bookId) {
    // Abort prior download for the same book.
    const prior = activeDownloads.get(bookId);
    if (prior) {
      try {
        prior.abort();
      } catch {
        // ignore
      }
    }
    activeDownloads.set(bookId, controller);
  }

  const res = await fetchWithAuthRetry(normalizedUrl, {}, controller.signal);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }

  // Cache the original response while we consume a clone for progress.
  const cachePutPromise = cache.put(normalizedUrl, res);

  let total = 0;
  const len = res.headers.get("content-length");
  if (len && !Number.isNaN(Number(len))) total = Number(len);
  if (!total && expectedBytes) total = expectedBytes;

  let downloaded = 0;
  const clone = res.clone();
  if (clone.body && clone.body.getReader) {
    const reader = clone.body.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength) {
        downloaded += value.byteLength;
        if (onProgress) {
          try {
            onProgress(downloaded, total);
          } catch {
            // ignore
          }
        }
        postToAllClients({
          type: OUT_PROGRESS,
          bookId,
          fileId,
          mediaType,
          url: normalizedUrl,
          bytesDownloaded: downloaded,
          bytesTotal: total,
        });
      }
    }
  }

  await cachePutPromise;

  postToAllClients({
    type: OUT_STATUS,
    bookId,
    fileId,
    mediaType,
    url: normalizedUrl,
    status: "ready",
  });
}

function enqueueBook(bookId) {
  const id = String(bookId);
  if (queuedBooks.has(id)) return;
  queuedBooks.add(id);
  bookQueue.push(id);
  processQueue().catch(() => {});
}

async function processQueue() {
  if (processingQueue) return;
  processingQueue = true;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = bookQueue.shift();
      if (!next) break;
      queuedBooks.delete(next);
      await cacheBookNow(next);
    }
  } finally {
    processingQueue = false;
  }
}

async function cacheBookNow(bookId) {
  const record = await dbGet(bookId);
  if (!record || !Array.isArray(record.files) || record.files.length === 0) {
    postToAllClients({ type: OUT_STATUS, bookId, status: "failed", error: "Missing file manifest." });
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  const totalBytes = record.files.reduce((sum, f) => sum + Number(f.bytesTotal || 0), 0);
  let readyBytes = 0;

  // Mark any already-cached files as ready so we can resume after reloads.
  for (const f of record.files) {
    const normalized = stripHash(String(f.url));
    if (f.chunked && f.chunkSize) {
      // Chunked items: only treat as ready if the DB status says ready and at least one chunk exists.
      if (f.status === "ready") {
        try {
          const hit = await cache.match(
            buildChunkUrl(normalized, 0, Number(f.chunkSize || AUDIO_CHUNK_SIZE_BYTES)),
          );
          if (hit) {
            f.bytesDownloaded = Number(f.bytesTotal || 0);
            readyBytes += Number(f.bytesTotal || 0);
          } else {
            f.status = "queued";
            f.bytesDownloaded = 0;
          }
        } catch {
          // ignore
        }
      }
    } else {
      if (f.status === "ready") {
        try {
          const hit = await cache.match(normalized);
          if (hit) {
            f.bytesDownloaded = Number(f.bytesTotal || 0);
            readyBytes += Number(f.bytesTotal || 0);
          } else {
            f.status = "queued";
            f.bytesDownloaded = 0;
          }
        } catch {
          // ignore
        }
      }
    }
  }
  record.updatedAt = Date.now();
  await dbPut(record);

  postToAllClients({
    type: OUT_STATUS,
    bookId,
    status: "downloading",
    fileCount: record.files.length,
  });

  // Download sequentially.
  for (const f of record.files) {
    if (f.status === "ready") {
      continue;
    }

    try {
      f.status = "downloading";
      f.bytesDownloaded = 0;
      delete f.error;
      delete record.error;
      record.updatedAt = Date.now();
      await dbPut(record);
      postToAllClients({
        type: OUT_STATUS,
        bookId,
        fileId: f.fileId,
        mediaType: f.mediaType,
        url: f.url,
        status: "downloading",
      });

      let lastPersist = 0;
      let lastEmit = 0;
      const onProgress = (downloaded, total) => {
        const now = Date.now();
        f.bytesDownloaded = downloaded;

        const overallDownloaded = readyBytes + downloaded;
        const progressOverall = totalBytes > 0 ? Math.min(overallDownloaded / totalBytes, 1) : 0;

        if (now - lastEmit > 120) {
          lastEmit = now;
          postToAllClients({
            type: OUT_PROGRESS,
            bookId,
            bytesDownloaded: overallDownloaded,
            bytesTotal: totalBytes || total,
            progressOverall,
          });
        }

        if (now - lastPersist > 500) {
          lastPersist = now;
          record.updatedAt = now;
          dbPut(record).catch(() => {});
        }
      };

      const normalized = stripHash(String(f.url));
      if (f.chunked && f.chunkSize) {
        await dbUrlPut({
          url: normalized,
          bookId: String(bookId),
          fileId: f.fileId != null ? String(f.fileId) : null,
          mediaType: f.mediaType,
          chunked: true,
          chunkSize: Number(f.chunkSize || AUDIO_CHUNK_SIZE_BYTES),
          bytesTotal: Number(f.bytesTotal || 0),
          contentType: null,
          updatedAt: Date.now(),
        }).catch(() => {});
        await cacheUrlChunked(f.url, {
          bookId,
          fileId: f.fileId,
          mediaType: f.mediaType,
          bytesTotal: f.bytesTotal,
          chunkSize: Number(f.chunkSize || AUDIO_CHUNK_SIZE_BYTES),
          onProgress,
        });
      } else {
        await dbUrlPut({
          url: normalized,
          bookId: String(bookId),
          fileId: f.fileId != null ? String(f.fileId) : null,
          mediaType: f.mediaType,
          chunked: false,
          chunkSize: 0,
          bytesTotal: Number(f.bytesTotal || 0),
          contentType: null,
          updatedAt: Date.now(),
        }).catch(() => {});
        await cacheUrl(f.url, {
          bookId,
          fileId: f.fileId,
          mediaType: f.mediaType,
          bytesTotal: f.bytesTotal,
          onProgress,
        });
      }

      f.status = "ready";
      f.bytesDownloaded = Number(f.bytesTotal || 0);
      readyBytes += Number(f.bytesTotal || 0);
      record.updatedAt = Date.now();
      await dbPut(record);
    } catch (err) {
      f.status = "failed";
      const msg = err && err.message ? err.message : String(err);
      f.error = msg;
      record.error = msg;
      record.updatedAt = Date.now();
      await dbPut(record);
      postToAllClients({
        type: OUT_STATUS,
        bookId,
        fileId: f.fileId,
        mediaType: f.mediaType,
        url: f.url,
        status: "failed",
        error: msg,
      });
      // Keep going with other files.
    }
  }

  const fileCount = record.files.length;
  const readyCount = record.files.filter((f) => f.status === "ready").length;
  const failedCount = record.files.filter((f) => f.status === "failed").length;
  const allReady = fileCount > 0 && readyCount === fileCount;
  const someReady = readyCount > 0;
  const anyFailed = failedCount > 0;

  // Important: don't treat "some files failed" as a total failure. Users commonly
  // consider the operation successful if (for example) the EPUB cached but the
  // audiobook didn't. The UI can surface partial state and offer retry.
  let status = "partial";
  if (allReady) status = "ready";
  else if (anyFailed && !someReady) status = "failed";

  if (allReady) {
    // Clear stale error messages from prior partial failures.
    delete record.error;
    record.updatedAt = Date.now();
    await dbPut(record);
  }

  postToAllClients({ type: OUT_STATUS, bookId, status, fileCount, readyCount, failedCount });
}

async function cacheBook(payload) {
  const bookId = String(payload.bookId);
  const files = Array.isArray(payload.files) ? payload.files : [];

  const record = {
    bookId,
    updatedAt: Date.now(),
    files: files.map((f) => ({
      url: stripHash(String(f.url)),
      bytesTotal: Number(f.bytesTotal || 0),
      fileId: f.fileId != null ? String(f.fileId) : null,
      mediaType: typeof f.mediaType === "string" ? f.mediaType : null,
      status: "queued",
      bytesDownloaded: 0,
      chunked:
        typeof f.mediaType === "string" &&
        f.mediaType === "audiobook" &&
        Number(f.bytesTotal || 0) >= AUDIO_CHUNK_THRESHOLD_BYTES,
      chunkSize: AUDIO_CHUNK_SIZE_BYTES,
    })),
  };
  await dbPut(record);
  await Promise.all(
    record.files.map((f) =>
      dbUrlPut({
        url: stripHash(String(f.url)),
        bookId,
        fileId: f.fileId,
        mediaType: f.mediaType,
        chunked: Boolean(f.chunked),
        chunkSize: Number(f.chunkSize || 0),
        bytesTotal: Number(f.bytesTotal || 0),
        contentType: null,
        updatedAt: Date.now(),
      }).catch(() => {}),
    ),
  );

  postToAllClients({ type: OUT_STATUS, bookId, status: "queued" });
  enqueueBook(bookId);
}

async function clearBook(payload) {
  const bookId = String(payload.bookId);
  const record = await dbGet(bookId);
  const cache = await caches.open(CACHE_NAME);

  // Remove from any pending queue slots.
  queuedBooks.delete(bookId);
  if (bookQueue.length) {
    for (let i = bookQueue.length - 1; i >= 0; i -= 1) {
      if (String(bookQueue[i]) === bookId) {
        bookQueue.splice(i, 1);
      }
    }
  }

  const controller = activeDownloads.get(bookId);
  if (controller) {
    try {
      controller.abort();
    } catch {
      // ignore
    }
    activeDownloads.delete(bookId);
  }

  if (record && Array.isArray(record.files)) {
    await Promise.all(
      record.files.map(async (f) => {
        const normalized = stripHash(String(f.url));
        try {
          await dbUrlDelete(normalized);
        } catch {
          // ignore
        }
        try {
          await cache.delete(normalized);
        } catch {
          // ignore
        }
        if (f && f.chunked && f.chunkSize) {
          const total = Number(f.bytesTotal || 0);
          const chunkSize = Number(f.chunkSize || AUDIO_CHUNK_SIZE_BYTES);
          const count = total > 0 ? Math.ceil(total / chunkSize) : 0;
          for (let i = 0; i < count; i += 1) {
            const chunkUrl = buildChunkUrl(normalized, i, chunkSize);
            try {
              // eslint-disable-next-line no-await-in-loop
              await cache.delete(chunkUrl);
            } catch {
              // ignore
            }
          }
        }
      }),
    );
  }

  await dbDelete(bookId);
  postToAllClients({ type: OUT_STATUS, bookId, status: "cleared" });
}

async function clearAll() {
  // Cancel in-flight downloads.
  for (const controller of activeDownloads.values()) {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }
  activeDownloads.clear();
  queuedBooks.clear();
  bookQueue.splice(0, bookQueue.length);

  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // ignore
  }
  try {
    await dbClear();
  } catch {
    // ignore
  }

  postToAllClients({ type: OUT_STATUS, status: "cleared_all" });
}

async function queryBooks(payload, source) {
  const ids = Array.isArray(payload.bookIds) ? payload.bookIds.map((id) => String(id)) : [];
  const cache = await caches.open(CACHE_NAME);
  const results = {};

  const normalizeMediaType = (t) => {
    if (!t) return "unknown";
    const s = String(t).toLowerCase();
    if (s === "ebook" || s === "audiobook") return s;
    return s;
  };

  for (const id of ids) {
    const record = await dbGet(id);
    if (!record) {
      results[id] = { status: "not_started", progress: 0, fileCount: 0, readyCount: 0, failedCount: 0 };
      continue;
    }
    let bytesTotal = 0;
    let bytesDownloaded = 0;
    let readyCount = 0;
    let hasQueued = false;
    let hasDownloading = false;
    let hasFailed = false;
    const byType = {};
    const files = record.files || [];
    for (const f of files) {
      const expected = Number(f.bytesTotal || 0);
      bytesTotal += expected;

      if (f.status === "queued") hasQueued = true;
      if (f.status === "downloading") hasDownloading = true;
      if (f.status === "failed") hasFailed = true;

      const mediaType = normalizeMediaType(f.mediaType);
      if (!byType[mediaType]) {
        byType[mediaType] = {
          status: "partial",
          progress: 0,
          bytesTotal: 0,
          bytesDownloaded: 0,
          fileCount: 0,
          readyCount: 0,
          failedCount: 0,
          lastError: null,
        };
      }
      const typeSummary = byType[mediaType];
      typeSummary.fileCount += 1;
      typeSummary.bytesTotal += expected;

      // Use DB status/bytesDownloaded as the source of truth. Cache probing is too
      // expensive for chunked audio and can produce false positives.
      if (f.status === "ready") {
        bytesDownloaded += expected;
        readyCount += 1;
        typeSummary.bytesDownloaded += expected;
        typeSummary.readyCount += 1;
        continue;
      }
      if (f.status === "failed") {
        typeSummary.failedCount += 1;
        if (f.error && !typeSummary.lastError) {
          typeSummary.lastError = String(f.error);
        }
      }

      const partial = Number(f.bytesDownloaded || 0);
      if (expected > 0) {
        bytesDownloaded += Math.min(partial, expected);
        typeSummary.bytesDownloaded += Math.min(partial, expected);
      } else {
        bytesDownloaded += Math.max(partial, 0);
        typeSummary.bytesDownloaded += Math.max(partial, 0);
      }
    }
    const progress = bytesTotal > 0 ? Math.min(bytesDownloaded / bytesTotal, 1) : 0;
    const fileCount = files.length;
    const allReady = readyCount === fileCount && fileCount > 0;
    let status = "partial";
    if (allReady) status = "ready";
    else if (hasFailed && readyCount === 0) status = "failed";
    else if (hasDownloading) status = "downloading";
    else if (hasQueued) status = "queued";

    const failedCount = files.filter((f) => f && f.status === "failed").length;
    // Derive per-mediaType statuses so the UI can tell users what is actually cached offline.
    Object.keys(byType).forEach((key) => {
      const t = byType[key];
      const typeAllReady = t.fileCount > 0 && t.readyCount === t.fileCount;
      const typeHasFailed = t.failedCount > 0;
      const typeHasDownloading = files.some((f) => normalizeMediaType(f.mediaType) === key && f.status === "downloading");
      const typeHasQueued = files.some((f) => normalizeMediaType(f.mediaType) === key && f.status === "queued");
      let typeStatus = "partial";
      if (typeAllReady) typeStatus = "ready";
      else if (typeHasFailed && t.readyCount === 0) typeStatus = "failed";
      else if (typeHasDownloading) typeStatus = "downloading";
      else if (typeHasQueued) typeStatus = "queued";
      const typeProgress = t.bytesTotal > 0 ? Math.min(t.bytesDownloaded / t.bytesTotal, 1) : 0;
      byType[key] = { ...t, status: typeStatus, progress: typeProgress };
    });

    results[id] = {
      status,
      progress,
      bytesTotal,
      bytesDownloaded,
      fileCount,
      readyCount,
      failedCount,
      byType,
      error: record.error ? String(record.error) : null,
    };
  }

  try {
    source.postMessage({ type: "QUERY_BOOKS_RESULT", requestId: payload.requestId, results });
  } catch {
    // ignore
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (!data || typeof data.type !== "string") return;
  const type = data.type;

  event.waitUntil(
    (async () => {
      if (type === MSG_CACHE_BOOK) {
        await cacheBook(data);
      } else if (type === MSG_CLEAR_BOOK) {
        await clearBook(data);
      } else if (type === MSG_CLEAR_ALL) {
        await clearAll();
      } else if (type === MSG_QUERY_BOOKS) {
        await queryBooks(data, event.source);
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = req.url;

  // Offline-first for cached book media.
  if ((req.method === "GET" || req.method === "HEAD") && isStreamUrl(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const normalized = stripHash(url);
        const rangeHeader = req.headers.get("range");
        const cached = await cache.match(normalized);

        // Non-chunked cached response.
        if (cached) {
          if (req.method === "HEAD") {
            const headers = new Headers(cached.headers);
            if (!headers.get("accept-ranges")) headers.set("accept-ranges", "bytes");
            return new Response(null, { status: 200, headers });
          }

          if (!rangeHeader) {
            return cached;
          }

          // Best-effort Range support for smaller cached items (e.g. EPUB/PDF).
          const buf = await cached.clone().arrayBuffer();
          const total = buf.byteLength;
          const parsed = parseRangeHeader(rangeHeader, total);
          if (!parsed) {
            return new Response("Range Not Satisfiable", {
              status: 416,
              headers: { "Content-Range": `bytes */${total}` },
            });
          }
          const { start, end } = parsed;
          const headers = new Headers(cached.headers);
          headers.set("accept-ranges", "bytes");
          headers.set("content-range", `bytes ${start}-${end}/${total}`);
          headers.set("content-length", String(end - start + 1));
          return new Response(buf.slice(start, end + 1), { status: 206, headers });
        }

        // Chunked cache path for large audiobooks (Range requests).
        const meta = await dbUrlGet(normalized).catch(() => null);
        if (meta && meta.chunked) {
          const total = Number(meta.bytesTotal || 0);
          const chunkSize = Number(meta.chunkSize || AUDIO_CHUNK_SIZE_BYTES);
          const contentType = meta.contentType || "audio/mp4";

          if (req.method === "HEAD") {
            const headers = new Headers();
            headers.set("accept-ranges", "bytes");
            headers.set("content-type", contentType);
            if (total > 0) headers.set("content-length", String(total));
            return new Response(null, { status: 200, headers });
          }

          const parsed = rangeHeader && total > 0 ? parseRangeHeader(rangeHeader, total) : null;
          const start = parsed ? parsed.start : 0;
          const end = parsed ? parsed.end : total > 0 ? total - 1 : 0;
          const hasRange = Boolean(rangeHeader) && Boolean(parsed) && total > 0;

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const firstChunk = Math.floor(start / chunkSize);
                const lastChunk = Math.floor(end / chunkSize);
                for (let idx = firstChunk; idx <= lastChunk; idx += 1) {
                  const chunkUrl = buildChunkUrl(normalized, idx, chunkSize);
                  // eslint-disable-next-line no-await-in-loop
                  const chunkRes = await cache.match(chunkUrl);
                  if (!chunkRes) {
                    throw new Error("Missing cached chunk");
                  }
                  // eslint-disable-next-line no-await-in-loop
                  const chunkBuf = await chunkRes.arrayBuffer();
                  const chunkStart = idx * chunkSize;
                  const from = idx === firstChunk ? start - chunkStart : 0;
                  const to = idx === lastChunk ? end - chunkStart : chunkBuf.byteLength - 1;
                  const slice = chunkBuf.slice(from, to + 1);
                  controller.enqueue(new Uint8Array(slice));
                }
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          const headers = new Headers();
          headers.set("accept-ranges", "bytes");
          headers.set("content-type", contentType);
          if (total > 0) headers.set("content-length", String(end - start + 1));
          if (hasRange) {
            headers.set("content-range", `bytes ${start}-${end}/${total}`);
            return new Response(stream, { status: 206, headers });
          }
          if (total > 0) headers.set("content-length", String(total));
          return new Response(stream, { status: 200, headers });
        }

        return fetch(req);
      })(),
    );
    return;
  }

  // App shell: stale-while-revalidate.
  if (req.method === "GET") {
    try {
      const u = new URL(url);
      if (u.origin === self.location.origin && (u.pathname === "/" || u.pathname.startsWith("/vendor/"))) {
        event.respondWith(
          (async () => {
            const cache = await caches.open(APP_SHELL_CACHE);
            const cached = await cache.match(req);
            const fetchPromise = fetch(req)
              .then((res) => {
                if (res && res.ok) {
                  cache.put(req, res.clone()).catch(() => {});
                }
                return res;
              })
              .catch(() => null);
            if (cached) {
              fetchPromise.catch(() => {});
              return cached;
            }
            const net = await fetchPromise;
            return net || new Response("Offline", { status: 503 });
          })(),
        );
        return;
      }
    } catch {
      // ignore
    }
  }
});
