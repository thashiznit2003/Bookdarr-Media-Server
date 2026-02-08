import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReaderProgressEntity } from './reader-progress.entity';
import { FileLoggerService } from '../logging/file-logger.service';

@Injectable()
export class ReaderProgressService {
  private readonly lastLogAt = new Map<string, number>();

  constructor(
    @InjectRepository(ReaderProgressEntity)
    private readonly progressRepo: Repository<ReaderProgressEntity>,
    private readonly logger: FileLoggerService,
  ) {}

  async getProgress(userId: string, kind: string, fileId: string) {
    const record = await this.progressRepo.findOne({
      where: { userId, kind, fileId },
    });
    if (!record) {
      throw new NotFoundException('Progress not found.');
    }
    return {
      data: record.data ? JSON.parse(record.data) : null,
      updatedAt: record.updatedAt,
    };
  }

  async setProgress(
    userId: string,
    kind: string,
    fileId: string,
    data: Record<string, unknown>,
    updatedAt?: number,
  ) {
    const ts = typeof updatedAt === 'number' ? updatedAt : Date.now();
    const existing = await this.progressRepo.findOne({
      where: { userId, kind, fileId },
    });
    if (!existing) {
      const record = this.progressRepo.create({
        userId,
        kind,
        fileId,
        data: JSON.stringify(data ?? {}),
        updatedAt: ts,
      });
      await this.progressRepo.save(record);
      this.logProgress(userId, kind, fileId, ts, true);
      return { data, updatedAt: ts };
    }
    if (existing.updatedAt > ts) {
      return {
        data: existing.data ? JSON.parse(existing.data) : null,
        updatedAt: existing.updatedAt,
      };
    }
    existing.data = JSON.stringify(data ?? {});
    existing.updatedAt = ts;
    await this.progressRepo.save(existing);
    this.logProgress(userId, kind, fileId, ts, false);
    return { data, updatedAt: ts };
  }

  async resetProgress(userId: string, kind: string, fileId: string) {
    const existing = await this.progressRepo.findOne({
      where: { userId, kind, fileId },
    });
    if (!existing) {
      return { status: 'ok' };
    }
    await this.progressRepo.remove(existing);
    this.logger.info('reader_progress_reset', { userId, kind, fileId });
    return { status: 'ok' };
  }

  private logProgress(
    userId: string,
    kind: string,
    fileId: string,
    updatedAt: number,
    created: boolean,
  ) {
    const key = `${userId}|${kind}|${fileId}`;
    const now = Date.now();
    const last = this.lastLogAt.get(key) ?? 0;
    // Progress updates can be frequent; keep a low-volume breadcrumb trail.
    if (now - last < 60_000 && !created) {
      return;
    }
    this.lastLogAt.set(key, now);
    this.logger.info('reader_progress_set', {
      userId,
      kind,
      fileId,
      updatedAt,
      created,
    });
  }
}
