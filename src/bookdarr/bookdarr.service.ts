import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import {
  BookdarrBookFilesResponse,
  BookdarrBookPoolItem,
  BookdarrBookPoolResponse,
  BookdarrBookResource,
  BookdarrBookResponse,
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

  async getApiUrl(): Promise<string> {
    const { apiUrl } = await this.getApiConfig();
    return apiUrl;
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

  async getBookResource(bookId: number): Promise<BookdarrBookResource | undefined> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    const url = this.joinUrl(apiUrl, `/api/v1/book?bookIds=${bookId}`);
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as BookdarrBookResponse;
    return Array.isArray(data) ? data[0] : undefined;
  }

  async getBookOverview(bookId: number): Promise<string | undefined> {
    const { apiUrl, apiKey } = await this.getApiConfig();
    const url = this.joinUrl(apiUrl, `/api/v1/book/${bookId}/overview`);
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as { overview?: string };
    return data?.overview ?? undefined;
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

  resolveImageUrl(apiUrl: string, path?: string): string | undefined {
    if (!path) {
      return undefined;
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return this.joinUrl(apiUrl, path);
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

  async fetchFromBookdarrPath(
    path: string,
    method: 'GET' | 'HEAD' = 'GET',
    range?: string,
  ) {
    const { apiUrl, apiKey } = await this.getApiConfig();
    const url = this.joinUrl(apiUrl, path);
    const headers: Record<string, string> = {
      'X-Api-Key': apiKey,
      'User-Agent': 'bookdarr-media-server',
    };
    if (range) {
      headers.Range = range;
    }

    return fetch(url, { headers, method });
  }

  private joinUrl(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, '');
    const trimmedPath = path.startsWith('/') ? path : `/${path}`;
    return `${trimmedBase}${trimmedPath}`;
  }
}
