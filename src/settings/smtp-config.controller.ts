import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SettingsService } from './settings.service';
import { SmtpConfigService, SmtpConfigInput } from './smtp-config.service';

@Controller('settings/smtp')
@UseGuards(AuthGuard, AdminGuard)
export class SmtpConfigController {
  constructor(
    private readonly smtpConfigService: SmtpConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async getConfig() {
    const config = await this.smtpConfigService.getConfig();
    if (config) {
      return {
        configured: this.smtpConfigService.isConfigured(config),
        host: config.host,
        port: config.port,
        user: config.user,
        from: config.from ?? undefined,
      };
    }
    const settings = this.settingsService.getSettings();
    const smtp = settings.smtp;
    const configured = Boolean(smtp.host && smtp.port && smtp.user && smtp.pass);
    return {
      configured,
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      from: smtp.from,
    };
  }

  @Post()
  async updateConfig(@Body() input: SmtpConfigInput) {
    const config = await this.smtpConfigService.upsert(input);
    return {
      configured: this.smtpConfigService.isConfigured(config),
      host: config.host,
      port: config.port,
      user: config.user,
      from: config.from ?? undefined,
    };
  }
}
