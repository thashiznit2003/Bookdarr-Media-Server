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
import { LibraryService } from './library.service';
import { OfflineDownloadService } from './offline-download.service';
import { LibraryStreamingService } from './library-streaming.service';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly offlineDownloadService: OfflineDownloadService,
    private readonly streaming: LibraryStreamingService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getLibrary(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.libraryService.getLibrary(userId);
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
    return this.libraryService.getMyLibrary(userId);
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'GET');
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.streaming.streamFile(id, req, res, 'HEAD');
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
    return this.libraryService.getLibraryDetail(id, userId);
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
  async checkoutBook(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
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

  // Minimal file manifest for device-side offline caching (Service Worker / PWA).
  @Get(':id/offline-manifest')
  @UseGuards(AuthGuard)
  async getOfflineManifest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'unauthorized' };
    }
    return this.libraryService.getOfflineManifest(userId, id);
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

  // Admin-only: clear VM-side cached ebook/audiobook media under data/offline.
  @Post('admin/clear-cache')
  @UseGuards(AuthGuard, AdminGuard)
  async clearServerOfflineCache() {
    return this.offlineDownloadService.clearAllCachedMedia();
  }
}
