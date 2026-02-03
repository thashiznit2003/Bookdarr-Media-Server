import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReaderConfigEntity } from './reader-config.entity';

export interface ReaderConfigInput {
  legacyEpubEnabled?: boolean;
}

@Injectable()
export class ReaderConfigService {
  constructor(
    @InjectRepository(ReaderConfigEntity)
    private readonly configRepo: Repository<ReaderConfigEntity>,
  ) {}

  async getConfig(): Promise<ReaderConfigEntity | null> {
    return this.configRepo.findOne({ where: {} });
  }

  async upsert(input: ReaderConfigInput): Promise<ReaderConfigEntity> {
    const existing = await this.getConfig();
    const legacyEpubEnabled = Boolean(input.legacyEpubEnabled);
    if (!existing) {
      const created = this.configRepo.create({ legacyEpubEnabled });
      return this.configRepo.save(created);
    }
    existing.legacyEpubEnabled = legacyEpubEnabled;
    return this.configRepo.save(existing);
  }
}
