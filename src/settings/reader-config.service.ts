import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReaderConfigEntity } from './reader-config.entity';
import { FileLoggerService } from '../logging/file-logger.service';

export interface ReaderConfigInput {
  legacyEpubEnabled?: boolean;
}

@Injectable()
export class ReaderConfigService {
  constructor(
    @InjectRepository(ReaderConfigEntity)
    private readonly configRepo: Repository<ReaderConfigEntity>,
    private readonly logger: FileLoggerService,
  ) {}

  async getConfig(): Promise<ReaderConfigEntity | null> {
    try {
      return await this.configRepo.findOne({ where: {} });
    } catch (error) {
      this.logger.warn('reader_config_load_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async upsert(input: ReaderConfigInput): Promise<ReaderConfigEntity> {
    const existing = await this.getConfig();
    const legacyEpubEnabled = Boolean(input.legacyEpubEnabled);
    if (!existing) {
      const created = this.configRepo.create({ legacyEpubEnabled });
      try {
        return await this.configRepo.save(created);
      } catch (error) {
        this.logger.warn('reader_config_save_failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        return created;
      }
    }
    existing.legacyEpubEnabled = legacyEpubEnabled;
    try {
      return await this.configRepo.save(existing);
    } catch (error) {
      this.logger.warn('reader_config_save_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return existing;
    }
  }
}
