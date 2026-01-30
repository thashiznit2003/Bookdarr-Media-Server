import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthConfigEntity } from './auth-config.entity';

export interface AuthSecretsInput {
  accessSecret?: string;
  refreshSecret?: string;
}

@Injectable()
export class AuthConfigService {
  constructor(
    @InjectRepository(AuthConfigEntity)
    private readonly configs: Repository<AuthConfigEntity>,
  ) {}

  async getConfig(): Promise<AuthConfigEntity | null> {
    return this.configs.findOne({ where: { id: 1 } });
  }

  async getSecrets(): Promise<AuthSecretsInput> {
    const config = await this.getConfig();
    return {
      accessSecret: config?.accessSecret ?? undefined,
      refreshSecret: config?.refreshSecret ?? undefined,
    };
  }

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return Boolean(config?.accessSecret && config?.refreshSecret);
  }

  async upsert(input: AuthSecretsInput) {
    const existing = await this.getConfig();
    const accessSecret = input.accessSecret ?? existing?.accessSecret ?? null;
    const refreshSecret = input.refreshSecret ?? existing?.refreshSecret ?? null;

    if (!accessSecret || accessSecret.trim().length === 0) {
      throw new BadRequestException('Access secret is required.');
    }

    if (!refreshSecret || refreshSecret.trim().length === 0) {
      throw new BadRequestException('Refresh secret is required.');
    }

    const record = this.configs.create({
      id: 1,
      accessSecret: accessSecret.trim(),
      refreshSecret: refreshSecret.trim(),
      updatedAt: new Date().toISOString(),
    });

    return this.configs.save(record);
  }
}
