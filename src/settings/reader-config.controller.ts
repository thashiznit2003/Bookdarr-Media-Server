import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ReaderConfigService } from './reader-config.service';

@Controller('settings/reader')
export class ReaderConfigController {
  constructor(private readonly readerConfigService: ReaderConfigService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getConfig() {
    const config = await this.readerConfigService.getConfig();
    return {
      legacyEpubEnabled: config?.legacyEpubEnabled ?? false,
    };
  }

  @Post()
  @UseGuards(AuthGuard)
  async updateConfig(@Body() input: { legacyEpubEnabled?: boolean }) {
    if (typeof input?.legacyEpubEnabled !== 'boolean') {
      throw new BadRequestException('Legacy EPUB flag must be true or false.');
    }
    const config = await this.readerConfigService.upsert({
      legacyEpubEnabled: input.legacyEpubEnabled,
    });
    return {
      legacyEpubEnabled: config.legacyEpubEnabled,
    };
  }
}
