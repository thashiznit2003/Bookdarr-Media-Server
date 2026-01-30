import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import {
  OpenLibraryDetails,
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

  async lookupDetails(match?: OpenLibraryMatch): Promise<OpenLibraryDetails | undefined> {
    if (!match?.key && !match?.editionKey) {
      return undefined;
    }

    const baseUrl = this.settingsService.getSettings().openLibrary.baseUrl;
    let path: string | undefined;

    if (match.editionKey) {
      path = `/books/${match.editionKey}.json`;
    } else if (match.key) {
      path = match.key.startsWith('/') ? `${match.key}.json` : `/works/${match.key}.json`;
    }

    if (!path) {
      return undefined;
    }

    const url = new URL(path, baseUrl);
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'bookdarr-media-server',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as {
      description?: string | { value?: string };
      subjects?: string[];
      number_of_pages?: number;
      pages?: number;
    };

    const description =
      typeof data.description === 'string'
        ? data.description
        : data.description?.value;

    return {
      description: description?.trim() || undefined,
      subjects: Array.isArray(data.subjects) ? data.subjects : undefined,
      pageCount: data.number_of_pages ?? data.pages,
    };
  }
}
