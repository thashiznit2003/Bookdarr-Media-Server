import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BookdarrConfigService } from '../bookdarr/bookdarr-config.service';
import { AuthConfigService } from '../auth/auth-config.service';
import { SmtpConfigService } from './smtp-config.service';

@Controller('api/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bookdarrConfigService: BookdarrConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly smtpConfigService: SmtpConfigService,
  ) {}

  @Get()
  async getSettings() {
    const settings = this.settingsService.getPublicSettings();
    const stored = await this.bookdarrConfigService.getConfig();
    if (stored?.apiUrl) {
      settings.bookdarr.apiUrl = stored.apiUrl;
      settings.bookdarr.configured = Boolean(stored.apiKey);
    }
    if (stored?.poolPath) {
      settings.bookdarr.poolPath = stored.poolPath;
    }

    const authConfigured = await this.authConfigService.isConfigured();
    settings.auth.configured = authConfigured;
    settings.auth.inviteRequired = settings.auth.inviteRequired;
    const smtpConfig = await this.smtpConfigService.getConfig();
    if (smtpConfig) {
      settings.smtp.host = smtpConfig.host;
      settings.smtp.port = smtpConfig.port;
      settings.smtp.from = smtpConfig.from ?? undefined;
      settings.smtp.configured = this.smtpConfigService.isConfigured(smtpConfig);
    }
    return settings;
  }
}
