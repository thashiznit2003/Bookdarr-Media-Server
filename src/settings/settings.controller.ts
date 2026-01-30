import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BookdarrConfigService } from '../bookdarr/bookdarr-config.service';

@Controller('api/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bookdarrConfigService: BookdarrConfigService,
  ) {}

  @Get()
  async getSettings() {
    const settings = this.settingsService.getPublicSettings();
    const stored = await this.bookdarrConfigService.getConfig();
    if (stored?.apiUrl) {
      settings.bookdarr.apiUrl = stored.apiUrl;
      settings.bookdarr.configured = Boolean(stored.apiKey);
    }
    return settings;
  }
}
