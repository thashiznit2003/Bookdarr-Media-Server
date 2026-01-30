import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import {
  BookdarrBookFilesResponse,
  BookdarrBookPoolItem,
  BookdarrBookPoolResponse,
} from './bookdarr.types';
import { BookdarrConfigService } from './bookdarr-config.service';

@Injectable()
export class BookdarrService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly bookdarrConfigService: BookdarrConfigService,
  ) {}

  private async getApiConfig() {
    const settings = this.settingsService.getSettings();
    const storedConfig = await this.bookdarrConfigService.getConfig();
    const apiUrl = storedConfig?.apiUrl ?? settings.bookdarr.apiUrl;
    const apiKey = storedConfig?.apiKey ?? settings.bookdarr.apiKey;

    if (!apiUrl || !apiKey) {
      throw new ServiceUnavailableException('Bookdarr API is not configured.');
    }

    return {
      apiUrl,
      apiKey,
      poolPath:
        storedConfig?.poolPath ??
        settings.bookdarr.poolPath ??
        '/api/v1/user/library/pool',
    };
  }

  async getBookPool(): Promise<BookdarrBookPoolItem[]> {
    const { apiUrl, apiKey, poolPath } = await this.getApiConfig();
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

  async getBookFiles(bookId: number): Promise<BookdarrBookFilesResponse> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    const url = this.joinUrl(apiUrl, `/api/v1/bookfile?bookId=${bookId}`);

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ServiceUnavailableException(
        `Bookdarr book files fetch failed (${response.status}). ${errorText}`,
      );
    }

    return (await response.json()) as BookdarrBookFilesResponse;
  }

  async streamBookFile(
    bookFileId: number,
    range?: string,
    method: 'GET' | 'HEAD' = 'GET',
  ) {
    const { apiUrl, apiKey } = await this.getApiConfig();
    const url = this.joinUrl(apiUrl, `/api/v1/bookfile/${bookFileId}/stream`);
    const headers: Record<string, string> = {
      'X-Api-Key': apiKey,
      'User-Agent': 'bookdarr-media-server',
    };
    if (range) {
      headers.Range = range;
    }

    const response = await fetch(url, { headers, method });
    if (!response.ok) {
      const errorText = await response.text();
      throw new ServiceUnavailableException(
        `Bookdarr book stream failed (${response.status}). ${errorText}`,
      );
    }

    return response;
  }

  private joinUrl(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, '');
    const trimmedPath = path.startsWith('/') ? path : `/${path}`;
    return `${trimmedBase}${trimmedPath}`;
  }
}
