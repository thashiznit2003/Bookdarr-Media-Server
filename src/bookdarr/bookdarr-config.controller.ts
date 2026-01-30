import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BookdarrConfigService } from './bookdarr-config.service';
import type { BookdarrConfigInput } from './bookdarr-config.service';

@Controller('settings/bookdarr')
export class BookdarrConfigController {
  constructor(private readonly bookdarrConfigService: BookdarrConfigService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getConfig() {
    const config = await this.bookdarrConfigService.getConfig();
    return {
      configured: Boolean(config?.apiUrl && config?.apiKey),
      apiUrl: config?.apiUrl,
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  async updateConfig(@Body() input: BookdarrConfigInput) {
    const config = await this.bookdarrConfigService.upsert(input);
    return {
      configured: Boolean(config.apiUrl && config.apiKey),
      apiUrl: config.apiUrl,
    };
  }
}
