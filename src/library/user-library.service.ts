import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
    existing.returnedAt = new Date().toISOString();
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
}
