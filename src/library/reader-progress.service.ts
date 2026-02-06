import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReaderProgressEntity } from './reader-progress.entity';

@Injectable()
export class ReaderProgressService {
  constructor(
    @InjectRepository(ReaderProgressEntity)
    private readonly progressRepo: Repository<ReaderProgressEntity>,
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
    return { status: 'ok' };
  }
}
