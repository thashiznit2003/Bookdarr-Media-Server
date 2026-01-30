import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { BookdarrBookPoolItem, BookdarrBookPoolResponse } from './bookdarr.types';

@Injectable()
export class BookdarrService {
  constructor(private readonly settingsService: SettingsService) {}

  async getBookPool(): Promise<BookdarrBookPoolItem[]> {
    const settings = this.settingsService.getSettings();
    const apiUrl = settings.bookdarr.apiUrl;
    const apiKey = settings.bookdarr.apiKey;

    if (!apiUrl || !apiKey) {
      throw new ServiceUnavailableException('Bookdarr API is not configured.');
    }

    const poolPath = settings.bookdarr.poolPath ?? '/api/v1/user/library/pool';
    const url = this.joinUrl(apiUrl, poolPath);

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ServiceUnavailableException(
        `Bookdarr book pool fetch failed (${response.status}). ${errorText}`,
      );
    }

    return (await response.json()) as BookdarrBookPoolResponse;
  }

  private joinUrl(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, '');
    const trimmedPath = path.startsWith('/') ? path : `/${path}`;
    return `${trimmedBase}${trimmedPath}`;
  }
}
