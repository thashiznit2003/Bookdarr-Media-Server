import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmtpConfigEntity } from './smtp-config.entity';

export interface SmtpConfigInput {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

@Injectable()
export class SmtpConfigService {
  constructor(
    @InjectRepository(SmtpConfigEntity)
    private readonly configRepo: Repository<SmtpConfigEntity>,
  ) {}

  async getConfig(): Promise<SmtpConfigEntity | null> {
    return this.configRepo.findOne({ where: { id: 1 } });
  }

  async upsert(input: SmtpConfigInput): Promise<SmtpConfigEntity> {
    const host = input.host?.trim();
    const user = input.user?.trim();
    const from = input.from?.trim();
    const port = input.port;

    if (!host) {
      throw new BadRequestException('SMTP host is required.');
    }
    if (!user) {
      throw new BadRequestException('SMTP username is required.');
    }
    if (!port || port < 1 || port > 65535) {
      throw new BadRequestException('SMTP port must be a valid TCP port.');
    }

    const existing = await this.getConfig();
    const passInput = input.pass?.trim();
    const pass = passInput && passInput.length > 0 ? passInput : existing?.pass;
    if (!pass) {
      throw new BadRequestException('SMTP password is required.');
    }

    const now = new Date().toISOString();
    const record = this.configRepo.create({
      id: 1,
      host,
      port,
      user,
      pass,
      from: from && from.length > 0 ? from : null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    return this.configRepo.save(record);
  }

  isConfigured(config?: SmtpConfigEntity | null) {
    if (!config) return false;
    return Boolean(config.host && config.port && config.user && config.pass);
  }
}
