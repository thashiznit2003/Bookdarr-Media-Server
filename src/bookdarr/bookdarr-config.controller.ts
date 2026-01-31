import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BookdarrConfigService } from './bookdarr-config.service';
import type { BookdarrConfigInput } from './bookdarr-config.service';
import { SettingsService } from '../settings/settings.service';

@Controller('settings/bookdarr')
export class BookdarrConfigController {
  constructor(
    private readonly bookdarrConfigService: BookdarrConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getConfig() {
    const config = await this.bookdarrConfigService.getConfig();
    const settings = this.settingsService.getSettings();
    const apiUrl = config?.apiUrl ?? settings.bookdarr.apiUrl;
    const apiKey = config?.apiKey ?? settings.bookdarr.apiKey;
    const poolPath = config?.poolPath ?? settings.bookdarr.poolPath;
    return {
      configured: Boolean(apiUrl && apiKey),
      apiUrl,
      poolPath: poolPath ?? undefined,
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  async updateConfig(@Body() input: BookdarrConfigInput) {
    const config = await this.bookdarrConfigService.upsert(input);
    return {
      configured: Boolean(config.apiUrl && config.apiKey),
      apiUrl: config.apiUrl,
      poolPath: config.poolPath ?? undefined,
    };
  }
}
