import {
  Body,
  Controller,
  Get,
  Head,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { StreamAuthGuard } from '../auth/stream-auth.guard';
import { RateLimitGuard } from '../auth/rate-limit.guard';
import { RateLimit } from '../auth/rate-limit.decorator';
import { LibraryService } from './library.service';
import { OfflineDownloadService } from './offline-download.service';
import { LibraryStreamingService } from './library-streaming.service';

@Controller('api/v1/library')
export class ApiV1LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly offlineDownloadService: OfflineDownloadService,
    private readonly streaming: LibraryStreamingService,
  ) {}

  private rewriteUrlToV1(url: unknown): unknown {
    if (typeof url !== 'string') return url;
    if (url.startsWith('/api/v1/')) return url;
    if (url.startsWith('/library/')) return `/api/v1${url}`;
    return url;
  }

  private rewriteLibraryPayloadToV1<T>(payload: T): T {
    if (!payload || typeof payload !== 'object') return payload;

    const maybeAny = payload as any;
    if (typeof maybeAny.coverUrl === 'string') {
      maybeAny.coverUrl = this.rewriteUrlToV1(maybeAny.coverUrl);
    }
    if (Array.isArray(maybeAny.files)) {
      maybeAny.files = maybeAny.files.map((f: any) => {
        if (typeof f?.streamUrl === 'string') {
          return { ...f, streamUrl: this.rewriteUrlToV1(f.streamUrl) };
        }
        return f;
      });
    }
    if (Array.isArray(maybeAny.ebookFiles)) {
      maybeAny.ebookFiles = maybeAny.ebookFiles.map((f: any) => {
        if (typeof f?.streamUrl === 'string') {
          return { ...f, streamUrl: this.rewriteUrlToV1(f.streamUrl) };
        }
        return f;
      });
    }
    if (Array.isArray(maybeAny.audiobookFiles)) {
      maybeAny.audiobookFiles = maybeAny.audiobookFiles.map((f: any) => {
        if (typeof f?.streamUrl === 'string') {
          return { ...f, streamUrl: this.rewriteUrlToV1(f.streamUrl) };
        }
        return f;
      });
    }
    return payload;
  }

  @Get()
  @UseGuards(AuthGuard)
  async getLibrary(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    const items = await this.libraryService.getLibrary(userId);
    return Array.isArray(items)
      ? items.map((it) => this.rewriteLibraryPayloadToV1(it))
      : items;
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  async refreshLibrary(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.libraryService.refreshLibrary(userId);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyLibrary(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return [];
    }
    const items = await this.libraryService.getMyLibrary(userId);
    return Array.isArray(items)
      ? items.map((it) => this.rewriteLibraryPayloadToV1(it))
      : items;
  }

  @Get('files/:id/stream')
  @UseGuards(StreamAuthGuard)
  async streamBookFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'GET');
  }

  @Get('files/:id/stream/:name')
  @UseGuards(StreamAuthGuard)
  async streamBookFileNamed(
    @Param('id', ParseIntPipe) id: number,
    @Param('name') name: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'GET', name);
  }

  @Head('files/:id/stream')
  @UseGuards(StreamAuthGuard)
  async headBookFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'HEAD');
  }

  @Head('files/:id/stream/:name')
  @UseGuards(StreamAuthGuard)
  async headBookFileNamed(
    @Param('id', ParseIntPipe) id: number,
    @Param('name') name: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'HEAD', name);
  }

  @Get('cover-image')
  @UseGuards(AuthGuard)
  async cover(
    @Query('path') path: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.proxyCover(path, req, res);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getLibraryDetail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    const detail = await this.libraryService.getLibraryDetail(id, userId);
    return this.rewriteLibraryPayloadToV1(detail);
  }

  @Post(':id/refresh')
  @UseGuards(AuthGuard)
  async refreshMetadata(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.libraryService.refreshMetadata(id, userId);
  }

  @Post(':id/checkout')
  @UseGuards(AuthGuard)
  async checkoutBook(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'unauthorized' };
    }
    return this.libraryService.checkoutBook(userId, id);
  }

  @Post(':id/return')
  @UseGuards(AuthGuard)
  async returnBook(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'unauthorized' };
    }
    return this.libraryService.returnBook(userId, id);
  }

  @Get(':id/offline-manifest')
  @UseGuards(AuthGuard)
  async getOfflineManifest(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'unauthorized' };
    }
    const manifest = await this.libraryService.getOfflineManifest(userId, id);
    // Mobile contract: prefer versioned URLs under /api/v1/*.
    return {
      ...manifest,
      files: (manifest as any)?.files?.map((file: any) => {
        const url = typeof file?.url === 'string' ? file.url : '';
        if (url.startsWith('/library/')) {
          return { ...file, url: `/api/v1${url}` };
        }
        return file;
      }),
    };
  }

  @Post(':id/read')
  @UseGuards(AuthGuard)
  async toggleReadStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { read?: boolean },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'unauthorized' };
    }
    const read = body?.read !== false;
    return this.libraryService.setReadStatus(userId, id, read);
  }

  @Post('admin/clear-cache')
  @UseGuards(AuthGuard, AdminGuard, RateLimitGuard)
  @RateLimit({
    id: 'library_admin_clear_cache',
    max: 3,
    windowMs: 10 * 60 * 1000,
    scope: 'ip',
  })
  async clearServerOfflineCache() {
    return this.offlineDownloadService.clearAllCachedMedia();
  }

  @Get('admin/storage')
  @UseGuards(AuthGuard, AdminGuard, RateLimitGuard)
  @RateLimit({
    id: 'library_admin_storage',
    max: 60,
    windowMs: 10 * 60 * 1000,
    scope: 'ip',
  })
  async getStorageStats() {
    return this.offlineDownloadService.getStorageStats();
  }
}
