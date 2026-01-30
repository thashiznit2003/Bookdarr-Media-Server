import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import {
  OpenLibraryMatch,
  OpenLibrarySearchResponse,
} from './openlibrary.types';

@Injectable()
export class OpenLibraryService {
  constructor(private readonly settingsService: SettingsService) {}

  async lookupByTitleAuthor(
    title: string,
    author?: string,
  ): Promise<OpenLibraryMatch | undefined> {
    const baseUrl = this.settingsService.getSettings().openLibrary.baseUrl;
    const url = new URL('/search.json', baseUrl);
    url.searchParams.set('title', title);
    if (author) {
      url.searchParams.set('author', author);
    }
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as OpenLibrarySearchResponse;
    const doc = data.docs?.[0];
    if (!doc) {
      return undefined;
    }

    return {
      title: doc.title,
      author: doc.author_name?.[0],
      publishYear: doc.first_publish_year,
      coverId: doc.cover_i,
      key: doc.key,
      editionKey: doc.edition_key?.[0],
    };
  }

  buildCoverUrl(coverId?: number, size: 'S' | 'M' | 'L' = 'L'): string | undefined {
    if (!coverId) {
      return undefined;
    }
    const baseUrl = this.settingsService.getSettings().openLibrary.baseUrl;
    return `${baseUrl.replace(/\/$/, '')}/b/id/${coverId}-${size}.jpg`;
  }
}
