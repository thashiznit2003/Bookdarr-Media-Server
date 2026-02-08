import {
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { extname } from 'path';
import { Readable } from 'stream';
import { BookdarrService } from '../bookdarr/bookdarr.service';
import { OfflineDownloadService } from './offline-download.service';
import { FileLoggerService } from '../logging/file-logger.service';

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.epub': 'application/epub+zip',
  '.pdf': 'application/pdf',
  '.mobi': 'application/x-mobipocket-ebook',
  '.azw': 'application/vnd.amazon.ebook',
  '.azw3': 'application/vnd.amazon.ebook',
  '.mp3': 'audio/mpeg',
  '.m4b': 'audio/mp4',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

@Injectable()
export class LibraryStreamingService {
  constructor(
    private readonly bookdarrService: BookdarrService,
    private readonly offlineDownloadService: OfflineDownloadService,
    private readonly logger: FileLoggerService,
  ) {}

  async proxyCover(path: string | undefined, req: Request, res: Response) {
    if (!path || !path.startsWith('/')) {
      res.status(400).json({ message: 'Cover path is required.' });
      return;
    }

    const upstream = await this.bookdarrService.fetchFromBookdarrPath(
      path,
      'GET',
      req.headers.range,
    );
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body as any).pipe(res);
  }

  async streamFile(
    id: number,
    req: Request,
    res: Response,
    method: 'GET' | 'HEAD',
    fileNameHint?: string,
  ) {
    const start = Date.now();
    const userId = (req as any).user?.userId as string | undefined;
    if (userId) {
      const cachedPath = await this.offlineDownloadService.getCachedFilePath(
        userId,
        id,
      );
      if (cachedPath) {
        await this.sendCachedFile(cachedPath, req, res, method);
        this.logger.info(
          method === 'GET' ? 'library_stream_cached' : 'library_head_cached',
          {
            fileId: id,
            userId,
            range: req.headers.range ?? null,
            durationMs: Date.now() - start,
          },
        );
        return;
      }
    }

    const range = req.headers.range;
    const upstream = await this.bookdarrService.streamBookFile(
      id,
      range,
      method,
    );

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    this.applyContentTypeOverride(res, upstream.headers, fileNameHint);

    if (method === 'HEAD') {
      res.end();
      this.logger.info('library_head', {
        fileId: id,
        userId: userId ?? null,
        status: res.statusCode,
        range,
        durationMs: Date.now() - start,
      });
      return;
    }

    if (!upstream.body) {
      res.end();
      this.logger.warn('library_stream_empty', {
        fileId: id,
        userId: userId ?? null,
        status: upstream.status,
        range,
      });
      return;
    }

    Readable.fromWeb(upstream.body as any).pipe(res);
    res.on('finish', () => {
      this.logger.info('library_stream', {
        fileId: id,
        userId: userId ?? null,
        status: res.statusCode,
        range,
        durationMs: Date.now() - start,
      });
    });
  }

  private async sendCachedFile(
    filePath: string,
    req: Request,
    res: Response,
    method: 'GET' | 'HEAD',
  ) {
    const fileStat = await stat(filePath);
    const total = fileStat.size;
    const range = req.headers.range;
    const contentType = this.getContentType(filePath);

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', contentType);

    if (range) {
      const parsed = this.parseRange(range, total);
      if (!parsed) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`);
        res.end();
        return;
      }
      const { start, end } = parsed;
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', chunkSize);
      if (method === 'HEAD') {
        res.end();
        return;
      }
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.status(200);
    res.setHeader('Content-Length', total);
    if (method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  }

  private parseRange(range: string, total: number) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) return null;
    const startRaw = match[1];
    const endRaw = match[2];
    let start = startRaw ? Number.parseInt(startRaw, 10) : NaN;
    let end = endRaw ? Number.parseInt(endRaw, 10) : NaN;

    if (Number.isNaN(start)) {
      if (Number.isNaN(end)) {
        return null;
      }
      start = Math.max(total - end, 0);
      end = total - 1;
    } else if (Number.isNaN(end)) {
      end = total - 1;
    }

    if (start < 0 || end < start || start >= total) {
      return null;
    }
    end = Math.min(end, total - 1);
    return { start, end };
  }

  private getContentType(filePath: string) {
    const ext = extname(filePath).toLowerCase();
    if (ext === '.epub') return 'application/epub+zip';
    if (ext === '.pdf') return 'application/pdf';
    if (ext === '.mobi') return 'application/x-mobipocket-ebook';
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.m4b' || ext === '.m4a') return 'audio/mp4';
    if (ext === '.aac') return 'audio/aac';
    if (ext === '.ogg') return 'audio/ogg';
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.flac') return 'audio/flac';
    return 'application/octet-stream';
  }

  private applyContentTypeOverride(
    res: Response,
    headers: { get: (key: string) => string | null },
    fileNameHint?: string,
  ) {
    const contentType = headers.get('content-type') ?? '';
    const normalizedContentType = contentType.split(';')[0]?.trim() ?? '';
    // Prefer the route filename (when available). Bookdarr sometimes omits Content-Disposition
    // or serves octet-stream; the named stream routes allow us to correct MIME types reliably.
    if (fileNameHint) {
      const hintExt = extname(fileNameHint).toLowerCase();
      const hintMapped = hintExt ? CONTENT_TYPE_BY_EXT[hintExt] : undefined;
      if (hintMapped) {
        res.setHeader('content-type', hintMapped);
        return;
      }
    }

    if (normalizedContentType && normalizedContentType !== 'application/octet-stream') {
      return;
    }
    const disposition = headers.get('content-disposition') ?? '';
    let fileName = '';
    if (disposition) {
      const fileNameMatch =
        disposition.match(/filename\\*=(?:UTF-8'')?([^;]+)/i) ||
        disposition.match(/filename=\"?([^\";]+)\"?/i);
      fileName = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1].trim())
        : '';
    }
    const extension = fileName ? extname(fileName).toLowerCase() : '';
    const mapped = extension ? CONTENT_TYPE_BY_EXT[extension] : undefined;
    if (!mapped) return;
    res.setHeader('content-type', mapped);
  }
}
