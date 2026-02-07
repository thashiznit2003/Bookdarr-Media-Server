import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ReaderProgressService } from './reader-progress.service';

@Controller('api/v1/reader/progress')
@UseGuards(AuthGuard)
export class ApiV1ReaderProgressController {
  constructor(private readonly progressService: ReaderProgressService) {}

  @Get(':kind/:fileId')
  getProgress(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('fileId') fileId: string,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { data: null, updatedAt: 0 };
    }
    return this.progressService.getProgress(userId, kind, fileId);
  }

  @Post(':kind/:fileId')
  setProgress(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('fileId') fileId: string,
    @Body() body: { data?: Record<string, unknown>; updatedAt?: number },
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { data: null, updatedAt: 0 };
    }
    return this.progressService.setProgress(
      userId,
      kind,
      fileId,
      body?.data ?? {},
      body?.updatedAt,
    );
  }

  @Post(':kind/:fileId/reset')
  resetProgress(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('fileId') fileId: string,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { status: 'ok' };
    }
    return this.progressService.resetProgress(userId, kind, fileId);
  }

  @Post(':kind/:fileId/sync')
  async syncProgress(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('fileId') fileId: string,
    @Body() body: { data?: Record<string, unknown>; updatedAt?: number },
    @Query('prefer') prefer?: string,
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return { data: null, updatedAt: 0 };
    }
    if (prefer === 'server') {
      try {
        return await this.progressService.getProgress(userId, kind, fileId);
      } catch {
        return this.progressService.setProgress(
          userId,
          kind,
          fileId,
          body?.data ?? {},
          body?.updatedAt,
        );
      }
    }
    return this.progressService.setProgress(
      userId,
      kind,
      fileId,
      body?.data ?? {},
      body?.updatedAt,
    );
  }
}

