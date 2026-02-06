/* BMS Service Worker
 *
 * Goals:
 * - Provide device-side offline caching for checked-out books (My Library).
 * - Keep behavior explicit: we only cache media when instructed by the app.
 * - Support progress events back to the UI.
 *
 * Note: this is best-effort for browsers. iOS may purge Cache Storage.
 */

const CACHE_VERSION = 1;
const CACHE_NAME = `bms-offline-v${CACHE_VERSION}`;
const APP_SHELL_CACHE = `bms-shell-v${CACHE_VERSION}`;

const DB_NAME = "bms-offline-db";
const DB_VERSION = 1;
const STORE_BOOKS = "books";

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

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: "bookId" });
      }
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
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.clear();
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
    const u = new URL(url);
    return u.pathname.startsWith("/library/files/") && u.pathname.includes("/stream");
  } catch {
    return false;
  }
}

function stripHash(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
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

  const res = await fetch(normalizedUrl, {
    credentials: "include",
    cache: "no-store",
    signal: controller.signal,
  });
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
    postToAllClients({ type: OUT_STATUS, bookId, status: "failed" });
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  const totalBytes = record.files.reduce((sum, f) => sum + Number(f.bytesTotal || 0), 0);
  let readyBytes = 0;

  // Mark any already-cached files as ready so we can resume after reloads.
  for (const f of record.files) {
    try {
      const hit = await cache.match(stripHash(String(f.url)));
      if (hit) {
        f.status = "ready";
        f.bytesDownloaded = Number(f.bytesTotal || 0);
        readyBytes += Number(f.bytesTotal || 0);
      }
    } catch {
      // ignore
    }
  }
  record.updatedAt = Date.now();
  await dbPut(record);

  postToAllClients({ type: OUT_STATUS, bookId, status: "downloading" });

  // Download sequentially.
  for (const f of record.files) {
    if (f.status === "ready") {
      continue;
    }

    try {
      f.status = "downloading";
      f.bytesDownloaded = 0;
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
      await cacheUrl(f.url, {
        bookId,
        fileId: f.fileId,
        mediaType: f.mediaType,
        bytesTotal: f.bytesTotal,
        onProgress: (downloaded, total) => {
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
        },
      });

      f.status = "ready";
      f.bytesDownloaded = Number(f.bytesTotal || 0);
      readyBytes += Number(f.bytesTotal || 0);
      record.updatedAt = Date.now();
      await dbPut(record);
    } catch (err) {
      f.status = "failed";
      record.error = err && err.message ? err.message : String(err);
      record.updatedAt = Date.now();
      await dbPut(record);
      postToAllClients({ type: OUT_STATUS, bookId, fileId: f.fileId, url: f.url, status: "failed" });
      // Keep going with other files.
    }
  }

  const allReady = record.files.length > 0 && record.files.every((f) => f.status === "ready");
  const anyFailed = record.files.some((f) => f.status === "failed");
  postToAllClients({ type: OUT_STATUS, bookId, status: allReady ? "ready" : anyFailed ? "failed" : "partial" });
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
    })),
  };
  await dbPut(record);

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
        try {
          await cache.delete(stripHash(String(f.url)));
        } catch {
          // ignore
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

  for (const id of ids) {
    const record = await dbGet(id);
    if (!record) {
      results[id] = { status: "not_started", progress: 0 };
      continue;
    }
    let bytesTotal = 0;
    let bytesDownloaded = 0;
    let readyCount = 0;
    let hasQueued = false;
    let hasDownloading = false;
    let hasFailed = false;
    const files = record.files || [];
    for (const f of files) {
      const expected = Number(f.bytesTotal || 0);
      bytesTotal += expected;

      if (f.status === "queued") hasQueued = true;
      if (f.status === "downloading") hasDownloading = true;
      if (f.status === "failed") hasFailed = true;

      // If cached, treat as fully downloaded.
      let isCached = false;
      try {
        const hit = await cache.match(stripHash(String(f.url)));
        isCached = Boolean(hit);
      } catch {
        isCached = false;
      }
      if (isCached) {
        bytesDownloaded += expected;
        readyCount += 1;
        continue;
      }

      const partial = Number(f.bytesDownloaded || 0);
      if (expected > 0) {
        bytesDownloaded += Math.min(partial, expected);
      } else {
        bytesDownloaded += Math.max(partial, 0);
      }
    }
    const progress = bytesTotal > 0 ? Math.min(bytesDownloaded / bytesTotal, 1) : 0;
    const fileCount = files.length;
    const allReady = readyCount === fileCount && fileCount > 0;
    let status = "partial";
    if (allReady) status = "ready";
    else if (hasFailed) status = "failed";
    else if (hasDownloading) status = "downloading";
    else if (hasQueued) status = "queued";

    results[id] = { status, progress, bytesTotal, bytesDownloaded };
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
  if (req.method === "GET" && isStreamUrl(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const normalized = stripHash(url);
        const cached = await cache.match(normalized);
        if (cached) {
          return cached;
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
