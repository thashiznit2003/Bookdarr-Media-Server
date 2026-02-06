import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthConfigEntity } from './auth-config.entity';
import { SettingsService } from '../settings/settings.service';

export interface AuthSecretsInput {
  accessSecret?: string;
  refreshSecret?: string;
}

@Injectable()
export class AuthConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(AuthConfigEntity)
    private readonly configs: Repository<AuthConfigEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    await this.ensureConfigured();
  }

  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  async getConfig(): Promise<AuthConfigEntity | null> {
    return this.configs.findOne({ where: { id: 1 } });
  }

  async getSecrets(): Promise<AuthSecretsInput> {
    const config = await this.getConfig();
    if (!config?.accessSecret || !config?.refreshSecret) {
      const ensured = await this.ensureConfigured();
      return {
        accessSecret: ensured?.accessSecret ?? undefined,
        refreshSecret: ensured?.refreshSecret ?? undefined,
      };
    }
    return {
      accessSecret: config?.accessSecret ?? undefined,
      refreshSecret: config?.refreshSecret ?? undefined,
    };
  }

  async isConfigured(): Promise<boolean> {
    const config = await this.ensureConfigured();
    return Boolean(config?.accessSecret && config?.refreshSecret);
  }

  async ensureConfigured(): Promise<AuthConfigEntity> {
    const existing = await this.getConfig();
    const auth = this.settingsService.getSettings().auth;
    const accessSecret = (
      existing?.accessSecret ??
      auth.accessSecret ??
      ''
    ).trim();
    const refreshSecret = (
      existing?.refreshSecret ??
      auth.refreshSecret ??
      ''
    ).trim();
    const finalAccessSecret =
      accessSecret.length > 0 ? accessSecret : this.generateSecret();
    const finalRefreshSecret =
      refreshSecret.length > 0 ? refreshSecret : this.generateSecret();

    if (
      existing &&
      existing.accessSecret === finalAccessSecret &&
      existing.refreshSecret === finalRefreshSecret
    ) {
      return existing;
    }

    const record = this.configs.create({
      id: 1,
      accessSecret: finalAccessSecret,
      refreshSecret: finalRefreshSecret,
      updatedAt: new Date().toISOString(),
    });

    return this.configs.save(record);
  }

  async rotate(): Promise<AuthConfigEntity> {
    const record = this.configs.create({
      id: 1,
      accessSecret: this.generateSecret(),
      refreshSecret: this.generateSecret(),
      updatedAt: new Date().toISOString(),
    });

    return this.configs.save(record);
  }

  async upsert(input: AuthSecretsInput) {
    const existing = await this.getConfig();
    const accessSecret = input.accessSecret ?? existing?.accessSecret ?? null;
    const refreshSecret =
      input.refreshSecret ?? existing?.refreshSecret ?? null;

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
