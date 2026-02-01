import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserLibraryEntity } from './user-library.entity';

@Injectable()
export class UserLibraryService {
  constructor(
    @InjectRepository(UserLibraryEntity)
    private readonly userLibraryRepo: Repository<UserLibraryEntity>,
  ) {}

  async checkout(userId: string, bookId: number) {
    const existing = await this.userLibraryRepo.findOne({
      where: { userId, bookId, returnedAt: IsNull() },
    });
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const record = this.userLibraryRepo.create({
      userId,
      bookId,
      checkedOutAt: now,
      returnedAt: null,
    });
    return this.userLibraryRepo.save(record);
  }

  async returnBook(userId: string, bookId: number) {
    const existing = await this.userLibraryRepo.findOne({
      where: { userId, bookId, returnedAt: IsNull() },
    });
    if (!existing) {
      return null;
    }
    const now = new Date().toISOString();
    existing.returnedAt = now;
    if (!existing.readAt) {
      existing.readAt = now;
    }
    return this.userLibraryRepo.save(existing);
  }

  async getActiveForUser(userId: string) {
    return this.userLibraryRepo.find({
      where: { userId, returnedAt: IsNull() },
      order: { checkedOutAt: 'DESC' },
    });
  }

  async getActiveByBookId(userId: string, bookId: number) {
    return this.userLibraryRepo.findOne({
      where: { userId, bookId, returnedAt: IsNull() },
    });
  }

  async getReadMap(userId: string) {
    const reads = await this.userLibraryRepo.find({
      where: { userId, readAt: Not(IsNull()) },
      order: { readAt: 'DESC' },
    });
    const map = new Map<number, string>();
    for (const record of reads) {
      if (!map.has(record.bookId) && record.readAt) {
        map.set(record.bookId, record.readAt);
      }
    }
    return map;
  }

  async getReadStatus(userId: string, bookId: number) {
    const record = await this.userLibraryRepo.findOne({
      where: { userId, bookId, readAt: Not(IsNull()) },
      order: { readAt: 'DESC' },
    });
    return record?.readAt ?? null;
  }

  async setReadStatus(userId: string, bookId: number, read: boolean) {
    if (!read) {
      await this.userLibraryRepo.update({ userId, bookId }, { readAt: null });
      return;
    }

    const now = new Date().toISOString();
    const active = await this.userLibraryRepo.findOne({
      where: { userId, bookId, returnedAt: IsNull() },
      order: { checkedOutAt: 'DESC' },
    });
    if (active) {
      active.readAt = now;
      await this.userLibraryRepo.save(active);
      return;
    }

    const latest = await this.userLibraryRepo.findOne({
      where: { userId, bookId },
      order: { checkedOutAt: 'DESC' },
    });
    if (latest) {
      latest.readAt = now;
      await this.userLibraryRepo.save(latest);
      return;
    }

    const record = this.userLibraryRepo.create({
      userId,
      bookId,
      checkedOutAt: now,
      returnedAt: now,
      readAt: now,
    });
    await this.userLibraryRepo.save(record);
  }
}
