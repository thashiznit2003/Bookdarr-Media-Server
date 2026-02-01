import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createWriteStream } from 'fs';
import { access, mkdir, rename, rm } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { In, Repository } from 'typeorm';
import { BookdarrService } from '../bookdarr/bookdarr.service';
import type { BookdarrBookFileResource } from '../bookdarr/bookdarr.types';
import { FileLoggerService } from '../logging/file-logger.service';
import { OfflineDownloadEntity, OfflineDownloadStatus } from './offline-download.entity';

export type OfflineDownloadSummaryStatus =
  | 'not_started'
  | 'queued'
  | 'downloading'
  | 'ready'
  | 'failed';

export interface OfflineDownloadSummary {
  status: OfflineDownloadSummaryStatus;
  bytesTotal: number;
  bytesDownloaded: number;
  progress: number;
  fileCount: number;
  readyCount: number;
  failedCount: number;
}

@Injectable()
export class OfflineDownloadService implements OnModuleInit, OnModuleDestroy {
  private readonly baseDir = join(process.cwd(), 'data', 'offline');
  private readonly queuedIds = new Set<string>();
  private readonly queue: string[] = [];
  private readonly active = new Map<string, AbortController>();
  private processing = false;
  private stopping = false;

  constructor(
    @InjectRepository(OfflineDownloadEntity)
    private readonly downloadsRepo: Repository<OfflineDownloadEntity>,
    private readonly bookdarrService: BookdarrService,
    private readonly logger: FileLoggerService,
  ) {}

  async onModuleInit() {
    await this.resumePending();
  }

  onModuleDestroy() {
    this.stopping = true;
    for (const controller of this.active.values()) {
      controller.abort();
    }
  }

  async queueBook(userId: string, bookId: number) {
    let files: BookdarrBookFileResource[] = [];
    try {
      files = await this.bookdarrService.getBookFiles(bookId);
    } catch (error) {
      this.logger.error('Unable to queue offline downloads: book files unavailable.', {
        bookId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }

    const now = new Date().toISOString();
    const candidates = files
      .map((file) => {
        const filePath = file.path ?? '';
        const fileName = filePath ? basename(filePath) : `bookfile-${file.id}`;
        const format = extname(fileName).toLowerCase();
        const mediaType = this.getMediaType(file, format);
        return { file, fileName, format, mediaType };
      })
      .filter((entry) => entry.mediaType === 'ebook' || entry.mediaType === 'audiobook');

    const queued: OfflineDownloadEntity[] = [];
    for (const entry of candidates) {
      const { file, fileName, format, mediaType } = entry;
      const extension = format || '.bin';
      const filePath = join(this.baseDir, userId, String(bookId), `${file.id}${extension}`);
      const existing = await this.downloadsRepo.findOne({
        where: { userId, bookId, fileId: file.id },
      });
      const bytesTotal = file.size ?? 0;

      if (existing?.status === 'ready') {
        queued.push(existing);
        continue;
      }

      if (existing) {
        await this.downloadsRepo.update(existing.id, {
          fileName,
          mediaType,
          status: 'queued',
          bytesTotal,
          bytesDownloaded: 0,
          filePath,
          error: null,
          updatedAt: now,
        });
        await this.safeRemove(filePath);
        await this.safeRemove(filePath + '.part');
        this.enqueue(existing.id);
        continue;
      }

      const record = this.downloadsRepo.create({
        userId,
        bookId,
        fileId: file.id,
        fileName,
        mediaType,
        status: 'queued',
        bytesTotal,
        bytesDownloaded: 0,
        filePath,
        error: null,
        createdAt: now,
        updatedAt: now,
      });
      const saved = await this.downloadsRepo.save(record);
      queued.push(saved);
      this.enqueue(saved.id);
    }

    return queued;
  }

  async removeBook(userId: string, bookId: number) {
    const downloads = await this.downloadsRepo.find({ where: { userId, bookId } });
    const ids = new Set(downloads.map((download) => download.id));

    for (const id of ids) {
      const controller = this.active.get(id);
      if (controller) {
        controller.abort();
        this.active.delete(id);
      }
      this.queuedIds.delete(id);
    }
    if (ids.size > 0) {
      this.queue.splice(
        0,
        this.queue.length,
        ...this.queue.filter((id) => !ids.has(id)),
      );
    }

    await this.downloadsRepo.delete({ userId, bookId });
    for (const download of downloads) {
      await this.safeRemove(download.filePath);
      await this.safeRemove(download.filePath + '.part');
    }
  }

  async getCachedFilePath(userId: string, fileId: number) {
    const record = await this.downloadsRepo.findOne({
      where: { userId, fileId, status: 'ready' },
    });
    if (!record) {
      return null;
    }
    try {
      await access(record.filePath);
      return record.filePath;
    } catch {
      await this.downloadsRepo.update(record.id, {
        status: 'failed',
        error: 'Cached file missing.',
        updatedAt: new Date().toISOString(),
      });
      return null;
    }
  }

  async getStatusForBook(userId: string, bookId: number): Promise<OfflineDownloadSummary | null> {
    const map = await this.getStatusMap(userId, [bookId]);
    return map.get(bookId) ?? null;
  }

  async getStatusMap(
    userId: string,
    bookIds: number[],
  ): Promise<Map<number, OfflineDownloadSummary>> {
    const map = new Map<number, OfflineDownloadSummary>();
    const statusCounts = new Map<
      number,
      { queued: number; downloading: number; failed: number; ready: number }
    >();
    if (!bookIds.length) {
      return map;
    }

    const downloads = await this.downloadsRepo.find({
      where: { userId, bookId: In(bookIds) },
    });

    for (const download of downloads) {
      const summary = map.get(download.bookId) ?? {
        status: 'not_started',
        bytesTotal: 0,
        bytesDownloaded: 0,
        progress: 0,
        fileCount: 0,
        readyCount: 0,
        failedCount: 0,
      };
      summary.fileCount += 1;
      summary.bytesTotal += download.bytesTotal ?? 0;
      summary.bytesDownloaded += Math.min(
        download.bytesDownloaded ?? 0,
        download.bytesTotal ?? Number.MAX_SAFE_INTEGER,
      );
      if (download.status === 'ready') {
        summary.readyCount += 1;
      }
      if (download.status === 'failed') {
        summary.failedCount += 1;
      }
      const counts = statusCounts.get(download.bookId) ?? {
        queued: 0,
        downloading: 0,
        failed: 0,
        ready: 0,
      };
      if (download.status === 'queued') counts.queued += 1;
      if (download.status === 'downloading') counts.downloading += 1;
      if (download.status === 'failed') counts.failed += 1;
      if (download.status === 'ready') counts.ready += 1;
      statusCounts.set(download.bookId, counts);
      map.set(download.bookId, summary);
    }

    for (const [bookId, summary] of map.entries()) {
      const hasDownloads = summary.fileCount > 0;
      if (!hasDownloads) {
        summary.status = 'not_started';
        summary.progress = 0;
        continue;
      }

      const counts = statusCounts.get(bookId);
      if (summary.readyCount === summary.fileCount) {
        summary.status = 'ready';
      } else if (summary.failedCount > 0) {
        summary.status = 'failed';
      } else {
        summary.status = counts?.downloading ? 'downloading' : 'queued';
      }

      if (summary.bytesTotal > 0) {
        summary.progress = Math.min(summary.bytesDownloaded / summary.bytesTotal, 1);
      } else if (summary.fileCount > 0) {
        summary.progress = summary.readyCount / summary.fileCount;
      } else {
        summary.progress = 0;
      }
    }

    return map;
  }

  private enqueue(id: string) {
    if (this.queuedIds.has(id) || this.active.has(id)) {
      return;
    }
    this.queuedIds.add(id);
    this.queue.push(id);
    this.processQueue();
  }

  private async resumePending() {
    const pending = await this.downloadsRepo.find({
      where: { status: In(['queued', 'downloading'] as OfflineDownloadStatus[]) },
    });
    if (!pending.length) {
      return;
    }
    const now = new Date().toISOString();
    for (const download of pending) {
      if (download.status === 'downloading') {
        await this.downloadsRepo.update(download.id, { status: 'queued', updatedAt: now });
      }
      this.enqueue(download.id);
    }
  }

  private async processQueue() {
    if (this.processing || this.stopping) {
      return;
    }
    this.processing = true;
    while (this.queue.length) {
      const id = this.queue.shift();
      if (!id) {
        continue;
      }
      this.queuedIds.delete(id);
      if (this.active.has(id)) {
        continue;
      }
      const record = await this.downloadsRepo.findOne({ where: { id } });
      if (!record || record.status === 'ready') {
        continue;
      }
      await this.downloadFile(record);
    }
    this.processing = false;
  }

  private async downloadFile(record: OfflineDownloadEntity) {
    const controller = new AbortController();
    this.active.set(record.id, controller);
    const now = new Date().toISOString();
    await this.downloadsRepo.update(record.id, {
      status: 'downloading',
      bytesDownloaded: 0,
      error: null,
      updatedAt: now,
    });

    let bytesDownloaded = 0;
    let bytesTotal = record.bytesTotal ?? 0;
    const tmpPath = record.filePath + '.part';

    try {
      const response = await this.bookdarrService.streamBookFile(
        record.fileId,
        undefined,
        'GET',
        controller.signal,
      );
      if (!response.body) {
        throw new Error('Missing download body.');
      }

      const lengthHeader = response.headers.get('content-length');
      const length = lengthHeader ? Number.parseInt(lengthHeader, 10) : NaN;
      if (!Number.isNaN(length) && length > 0) {
        bytesTotal = length;
      }
      if (bytesTotal !== record.bytesTotal && bytesTotal > 0) {
        await this.downloadsRepo.update(record.id, {
          bytesTotal,
          updatedAt: new Date().toISOString(),
        });
      }

      await mkdir(dirname(record.filePath), { recursive: true });
      const writer = createWriteStream(tmpPath);
      let lastUpdate = Date.now();
      const repo = this.downloadsRepo;
      const counter = new Transform({
        transform(chunk, _encoding, callback) {
          bytesDownloaded += chunk.length;
          if (Date.now() - lastUpdate > 1000) {
            lastUpdate = Date.now();
            void repo.update(record.id, {
              bytesDownloaded,
              bytesTotal,
              updatedAt: new Date().toISOString(),
            });
          }
          callback(null, chunk);
        },
      });

      await pipeline(Readable.fromWeb(response.body as any), counter, writer);
      await rename(tmpPath, record.filePath);
      const finalBytes = bytesTotal > 0 ? bytesTotal : bytesDownloaded;
      await this.downloadsRepo.update(record.id, {
        status: 'ready',
        bytesDownloaded: finalBytes,
        bytesTotal: finalBytes,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      await this.safeRemove(tmpPath);
      if (controller.signal.aborted || this.stopping) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      await this.downloadsRepo.update(record.id, {
        status: 'failed',
        error: message,
        updatedAt: new Date().toISOString(),
      });
      this.logger.error('Offline download failed.', {
        downloadId: record.id,
        fileId: record.fileId,
        bookId: record.bookId,
        userId: record.userId,
        error: message,
      });
    } finally {
      this.active.delete(record.id);
      this.processQueue();
    }
  }

  private getMediaType(file: BookdarrBookFileResource, format: string) {
    const raw = file.mediaType;
    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase();
      if (normalized.includes('audio')) {
        return 'audiobook';
      }
      if (normalized.includes('ebook')) {
        return 'ebook';
      }
    }
    if (typeof raw === 'number') {
      if (raw === 2) {
        return 'audiobook';
      }
      if (raw === 1) {
        return 'ebook';
      }
    }

    if (['.mp3', '.m4b', '.m4a', '.aac', '.ogg', '.wav', '.flac'].includes(format)) {
      return 'audiobook';
    }
    if (['.epub', '.pdf', '.mobi', '.azw', '.azw3', '.cbz', '.cbr'].includes(format)) {
      return 'ebook';
    }

    return 'unknown';
  }

  private async safeRemove(path: string) {
    if (!path) return;
    try {
      await rm(path, { force: true });
    } catch {
      // ignore cleanup failures
    }
  }
}
