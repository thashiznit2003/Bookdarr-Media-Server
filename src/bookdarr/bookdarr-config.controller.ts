import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { isIP } from 'net';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RateLimitGuard } from '../auth/rate-limit.guard';
import { RateLimit } from '../auth/rate-limit.decorator';
import { BookdarrConfigService } from './bookdarr-config.service';
import type { BookdarrConfigInput } from './bookdarr-config.service';
import { SettingsService } from '../settings/settings.service';
import { BookdarrService } from './bookdarr.service';

@Controller('settings/bookdarr')
export class BookdarrConfigController {
  constructor(
    private readonly bookdarrConfigService: BookdarrConfigService,
    private readonly settingsService: SettingsService,
    private readonly bookdarrService: BookdarrService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
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
  @UseGuards(AuthGuard, AdminGuard, RateLimitGuard)
  @RateLimit({ id: 'settings_bookdarr_update', max: 20, windowMs: 10 * 60 * 1000, scope: 'ip' })
  async updateConfig(@Body() input: BookdarrConfigInput) {
    const config = await this.bookdarrConfigService.upsert(input);
    return {
      configured: Boolean(config.apiUrl && config.apiKey),
      apiUrl: config.apiUrl,
      poolPath: config.poolPath ?? undefined,
    };
  }

  @Post('test')
  @UseGuards(AuthGuard, AdminGuard, RateLimitGuard)
  @RateLimit({ id: 'settings_bookdarr_test', max: 30, windowMs: 10 * 60 * 1000, scope: 'ip' })
  async testConfig(@Body() input?: BookdarrConfigInput) {
    let apiUrl: string | undefined;
    let apiKey: string | undefined;

    if (input?.host || input?.port || input?.apiKey) {
      const host = input.host?.trim();
      const port = input.port;
      const key = input.apiKey?.trim();
      if (!host || !key) {
        throw new BadRequestException('Host and API key are required to test.');
      }
      const protocol = input.useHttps ? 'https' : 'http';
      apiUrl = `${protocol}://${host}${port ? `:${port}` : ''}`;
      apiKey = key;
    } else {
      const config = await this.bookdarrService.getApiConfig();
      apiUrl = config.apiUrl;
      apiKey = config.apiKey;
    }

    const parsedUrl = new URL(apiUrl);
    if (!this.isAllowedHost(parsedUrl.hostname)) {
      throw new BadRequestException(
        'Bookdarr host must be a local/private address.',
      );
    }

    const testUrl = this.joinUrl(apiUrl, '/api/v1/system/status');
    const response = await fetch(testUrl, {
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        status: response.status,
        message: errorText || 'Unable to reach Bookdarr.',
      };
    }

    return {
      ok: true,
      status: response.status,
    };
  }

  private joinUrl(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, '');
    const trimmedPath = path.startsWith('/') ? path : `/${path}`;
    return `${trimmedBase}${trimmedPath}`;
  }

  private isAllowedHost(hostname: string): boolean {
    if (!hostname) return false;
    const lower = hostname.toLowerCase();
    if (
      lower === 'localhost' ||
      lower.endsWith('.local') ||
      !lower.includes('.')
    ) {
      return true;
    }

    const ipVersion = isIP(lower);
    if (ipVersion === 4) {
      const parts = lower.split('.').map((part) => Number(part));
      if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
        return false;
      }
      const [a, b] = parts;
      if (a === 10) return true;
      if (a === 127) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      return false;
    }

    if (ipVersion === 6) {
      if (lower === '::1') return true;
      if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
      if (
        lower.startsWith('fe8') ||
        lower.startsWith('fe9') ||
        lower.startsWith('fea') ||
        lower.startsWith('feb')
      ) {
        return true; // fe80::/10
      }
      return false;
    }

    return false;
  }
}
