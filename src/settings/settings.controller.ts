import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BookdarrConfigService } from '../bookdarr/bookdarr-config.service';
import { AuthConfigService } from '../auth/auth-config.service';

@Controller('api/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bookdarrConfigService: BookdarrConfigService,
    private readonly authConfigService: AuthConfigService,
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
    return settings;
  }
}
