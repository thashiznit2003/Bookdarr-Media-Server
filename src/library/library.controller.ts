import { Controller, Get, Head, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Readable } from 'stream';
import { AuthGuard } from '../auth/auth.guard';
import { LibraryService } from './library.service';
import { BookdarrService } from '../bookdarr/bookdarr.service';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly bookdarrService: BookdarrService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getLibrary() {
    return this.libraryService.getLibrary();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getLibraryDetail(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.getLibraryDetail(id);
  }

  @Post(':id/refresh')
  @UseGuards(AuthGuard)
  async refreshMetadata(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.refreshMetadata(id);
  }

  @Get('files/:id/stream')
  @UseGuards(AuthGuard)
  async streamBookFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const range = req.headers.range;
    const upstream = await this.bookdarrService.streamBookFile(id, range, 'GET');

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

  @Head('files/:id/stream')
  @UseGuards(AuthGuard)
  async headBookFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const range = req.headers.range;
    const upstream = await this.bookdarrService.streamBookFile(id, range, 'HEAD');
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end();
  }

  @Get('cover')
  @UseGuards(AuthGuard)
  async cover(
    @Query('path') path: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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
}
