import { Injectable, NotFoundException } from '@nestjs/common';
import { basename, extname } from 'path';
import { BookdarrService } from '../bookdarr/bookdarr.service';
import { OpenLibraryService } from '../openlibrary/openlibrary.service';
import { LibraryDetail, LibraryFile, LibraryItem, LibraryMediaType } from './library.types';
import type { BookdarrBookFileResource } from '../bookdarr/bookdarr.types';

@Injectable()
export class LibraryService {
  constructor(
    private readonly bookdarrService: BookdarrService,
    private readonly openLibraryService: OpenLibraryService,
  ) {}

  async getLibrary(): Promise<LibraryItem[]> {
    const bookPool = await this.bookdarrService.getBookPool();
    const apiUrl = await this.bookdarrService.getApiUrl();

    const items = await Promise.all(
      bookPool.map(async (item) => {
        const title = item.book?.title ?? 'Unknown title';
        const author =
          item.book?.author?.authorName ??
          item.book?.author?.authorNameLastFirst ??
          undefined;

        const bookdarrCoverRaw =
          item.book?.images?.find((image) => image.remoteUrl || image.url)
            ?.remoteUrl ??
          item.book?.images?.find((image) => image.url)?.url;
        const bookdarrCover = this.bookdarrService.resolveImageUrl(
          apiUrl,
          bookdarrCoverRaw,
        );
        let match;
        if (!bookdarrCover) {
          try {
            match = await this.openLibraryService.lookupByTitleAuthor(title, author);
          } catch {
            match = undefined;
          }
        }
        const openLibraryCover = this.openLibraryService.buildCoverUrl(match?.coverId);
        const coverUrl = bookdarrCover ?? openLibraryCover;

        return {
          id: item.bookId,
          title,
          author,
          publishYear: this.extractYear(item.book?.releaseDate),
          overview: item.book?.overview,
          coverUrl,
          bookdarrStatus: item.status,
          hasEbook: item.hasEbook,
          hasAudiobook: item.hasAudiobook,
          inMyLibrary: item.inMyLibrary,
        };
      }),
    );

    return items;
  }

  async getLibraryDetail(bookId: number): Promise<LibraryDetail> {
    const bookPool = await this.bookdarrService.getBookPool();
    const item = bookPool.find((entry) => entry.bookId === bookId);

    if (!item) {
      throw new NotFoundException('Book not found.');
    }

    const apiUrl = await this.bookdarrService.getApiUrl();
    const title = item.book?.title ?? 'Unknown title';
    const author =
      item.book?.author?.authorName ??
      item.book?.author?.authorNameLastFirst ??
      undefined;

    const bookdarrCoverRaw =
      item.book?.images?.find((image) => image.remoteUrl || image.url)
        ?.remoteUrl ??
      item.book?.images?.find((image) => image.url)?.url;
    const bookdarrCover = this.bookdarrService.resolveImageUrl(
      apiUrl,
      bookdarrCoverRaw,
    );
    const needsMetadata =
      !item.book?.overview || item.book.overview.trim().length === 0;
    const needsCover = !bookdarrCover;

    let match;
    let details;
    if (needsMetadata || needsCover) {
      try {
        match = await this.openLibraryService.lookupByTitleAuthor(title, author);
      } catch {
        match = undefined;
      }
      try {
        details = await this.openLibraryService.lookupDetails(match);
      } catch {
        details = undefined;
      }
    }

    const openLibraryCover = this.openLibraryService.buildCoverUrl(match?.coverId);
    const coverUrl = bookdarrCover ?? openLibraryCover;

    let files: LibraryFile[] = [];
    try {
      const bookFiles = await this.bookdarrService.getBookFiles(bookId);
      files = bookFiles.map((file) => this.mapBookFile(file));
    } catch {
      files = [];
    }

    const audiobookFiles = files.filter((file) => file.mediaType === 'audiobook');
    const ebookFiles = files.filter((file) => file.mediaType === 'ebook');

    return {
      id: item.bookId,
      title,
      author,
      publishYear: this.extractYear(item.book?.releaseDate),
      overview: item.book?.overview,
      coverUrl,
      bookdarrStatus: item.status,
      hasEbook: item.hasEbook,
      hasAudiobook: item.hasAudiobook,
      inMyLibrary: item.inMyLibrary,
      releaseDate: item.book?.releaseDate,
      description: item.book?.overview || details?.description,
      subjects: details?.subjects,
      pageCount: details?.pageCount,
      files,
      audiobookFiles,
      ebookFiles,
    };
  }

  async refreshMetadata(bookId: number): Promise<LibraryDetail> {
    const bookPool = await this.bookdarrService.getBookPool();
    const item = bookPool.find((entry) => entry.bookId === bookId);

    if (!item) {
      throw new NotFoundException('Book not found.');
    }

    const apiUrl = await this.bookdarrService.getApiUrl();
    const title = item.book?.title ?? 'Unknown title';
    const author =
      item.book?.author?.authorName ??
      item.book?.author?.authorNameLastFirst ??
      undefined;

    let match;
    try {
      match = await this.openLibraryService.lookupByTitleAuthor(title, author);
    } catch {
      match = undefined;
    }

    let details;
    try {
      details = await this.openLibraryService.lookupDetails(match);
    } catch {
      details = undefined;
    }

    const bookdarrCoverRaw =
      item.book?.images?.find((image) => image.remoteUrl || image.url)
        ?.remoteUrl ??
      item.book?.images?.find((image) => image.url)?.url;
    const bookdarrCover = this.bookdarrService.resolveImageUrl(
      apiUrl,
      bookdarrCoverRaw,
    );
    const openLibraryCover = this.openLibraryService.buildCoverUrl(match?.coverId);

    let files: LibraryFile[] = [];
    try {
      const bookFiles = await this.bookdarrService.getBookFiles(bookId);
      files = bookFiles.map((file) => this.mapBookFile(file));
    } catch {
      files = [];
    }

    const audiobookFiles = files.filter((file) => file.mediaType === 'audiobook');
    const ebookFiles = files.filter((file) => file.mediaType === 'ebook');

    return {
      id: item.bookId,
      title: match?.title ?? title,
      author: match?.author ?? author,
      publishYear: match?.publishYear,
      overview: item.book?.overview,
      coverUrl: openLibraryCover ?? bookdarrCover,
      bookdarrStatus: item.status,
      hasEbook: item.hasEbook,
      hasAudiobook: item.hasAudiobook,
      inMyLibrary: item.inMyLibrary,
      releaseDate: item.book?.releaseDate,
      description: details?.description ?? item.book?.overview,
      subjects: details?.subjects,
      pageCount: details?.pageCount,
      files,
      audiobookFiles,
      ebookFiles,
    };
  }

  private mapBookFile(file: BookdarrBookFileResource): LibraryFile {
    const filePath = file.path ?? '';
    const fileName = filePath ? basename(filePath) : `bookfile-${file.id}`;
    const format = extname(fileName).toLowerCase();
    const mediaType = this.getMediaType(file, format);

    return {
      id: file.id,
      fileName,
      size: file.size ?? 0,
      mediaType,
      format: format || undefined,
      streamUrl: `/library/files/${file.id}/stream`,
    };
  }

  private getMediaType(file: BookdarrBookFileResource, format: string): LibraryMediaType {
    const raw = file.mediaType;
    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase();
      if (normalized.includes('audio')) {
        return 'audiobook';
      }
      if (normalized.includes('ebook')) {
        return 'ebook';
      }
    }
    if (typeof raw === 'number') {
      if (raw === 2) {
        return 'audiobook';
      }
      if (raw === 1) {
        return 'ebook';
      }
    }

    if (['.mp3', '.m4b', '.m4a', '.aac', '.ogg', '.wav', '.flac'].includes(format)) {
      return 'audiobook';
    }
    if (['.epub', '.pdf', '.mobi', '.azw', '.azw3', '.cbz', '.cbr'].includes(format)) {
      return 'ebook';
    }

    return 'unknown';
  }

  private extractYear(dateValue?: string): number | undefined {
    if (!dateValue) {
      return undefined;
    }
    const match = dateValue.match(/\d{4}/);
    if (!match) {
      return undefined;
    }
    const year = Number.parseInt(match[0], 10);
    return Number.isNaN(year) ? undefined : year;
  }
}
