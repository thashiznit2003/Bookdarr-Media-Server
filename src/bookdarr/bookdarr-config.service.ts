import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookdarrConfigEntity } from './bookdarr-config.entity';

export interface BookdarrConfigInput {
  host: string;
  port: number;
  apiKey: string;
  useHttps?: boolean;
  poolPath?: string;
}

@Injectable()
export class BookdarrConfigService {
  constructor(
    @InjectRepository(BookdarrConfigEntity)
    private readonly configRepo: Repository<BookdarrConfigEntity>,
  ) {}

  async getConfig(): Promise<BookdarrConfigEntity | null> {
    return this.configRepo.findOne({ where: { id: 1 } });
  }

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return Boolean(config?.apiUrl && config?.apiKey);
  }

  async upsert(input: BookdarrConfigInput): Promise<BookdarrConfigEntity> {
    const host = input.host?.trim();
    if (!host) {
      throw new BadRequestException('Host is required.');
    }

    if (!input.port || input.port < 1 || input.port > 65535) {
      throw new BadRequestException('Port must be a valid TCP port.');
    }

    const apiKey = input.apiKey?.trim();
    if (!apiKey) {
      throw new BadRequestException('API key is required.');
    }

    const protocol = input.useHttps ? 'https' : 'http';
    const apiUrl = `${protocol}://${host}:${input.port}`;

    const existing = await this.getConfig();
    const poolPathRaw = input.poolPath?.trim();
    const poolPath = poolPathRaw && poolPathRaw.length > 0 ? poolPathRaw : existing?.poolPath ?? null;
    const now = new Date().toISOString();
    const record = this.configRepo.create({
      id: 1,
      apiUrl,
      apiKey,
      poolPath,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    return this.configRepo.save(record);
  }
}
