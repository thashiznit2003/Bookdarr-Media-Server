import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { basename, extname } from 'path';
import { BookdarrService } from '../bookdarr/bookdarr.service';
import { OpenLibraryService } from '../openlibrary/openlibrary.service';
import {
  LibraryDetail,
  LibraryFile,
  LibraryItem,
  LibraryMediaType,
} from './library.types';
import type { BookdarrBookFileResource } from '../bookdarr/bookdarr.types';
import { LibraryCacheService } from './library-cache.service';
import { UserLibraryService } from './user-library.service';
import { OfflineDownloadService } from './offline-download.service';
import { normalizeBookDescription } from './description.util';
import { FileLoggerService } from '../logging/file-logger.service';

@Injectable()
export class LibraryService {
  constructor(
    private readonly bookdarrService: BookdarrService,
    private readonly openLibraryService: OpenLibraryService,
    private readonly libraryCacheService: LibraryCacheService,
    private readonly userLibraryService: UserLibraryService,
    private readonly offlineDownloadService: OfflineDownloadService,
    private readonly logger: FileLoggerService,
  ) {}

  async getLibrary(userId?: string): Promise<LibraryItem[]> {
    const configKey = await this.bookdarrService.getConfigSignature();
    let items = await this.libraryCacheService.getCached(configKey);
    if (!items) {
      this.logger.info('library_cache_miss', { configKey });
      items = await this.buildLibraryItems();
      await this.libraryCacheService.setCached(configKey, items);
      this.logger.info('library_cache_rebuilt', {
        configKey,
        count: items.length,
      });
    }

    const filtered = items;
    if (!userId) {
      return filtered;
    }

    const checkouts = await this.userLibraryService.getActiveForUser(userId);
    const checkoutMap = new Map(
      checkouts.map((entry) => [entry.bookId, entry]),
    );
    const readMap = await this.userLibraryService.getReadMap(userId);
    const downloadMap = await this.offlineDownloadService.getStatusMap(
      userId,
      checkouts.map((entry) => entry.bookId),
    );
    return filtered.map((item) => {
      const checkout = checkoutMap.get(item.id);
      const readAt = readMap.get(item.id) ?? null;
      const downloadStatus = downloadMap.get(item.id) ?? null;
      return {
        ...item,
        checkedOutByMe: Boolean(checkout),
        checkedOutAt: checkout?.checkedOutAt ?? null,
        readByMe: Boolean(readAt),
        readAt,
        downloadStatus,
      };
    });
  }

  async getMyLibrary(userId: string): Promise<LibraryItem[]> {
    const library = await this.getLibrary(userId);
    return library.filter((item) => item.checkedOutByMe);
  }

  async refreshLibrary(userId?: string): Promise<LibraryItem[]> {
    const configKey = await this.bookdarrService.getConfigSignature();
    this.logger.info('library_refresh_start', { configKey, userId: userId ?? null });
    await this.libraryCacheService.clearCached();
    const items = await this.buildLibraryItems();
    await this.libraryCacheService.setCached(configKey, items);
    this.logger.info('library_refresh_done', {
      configKey,
      userId: userId ?? null,
      count: items.length,
    });
    if (!userId) {
      return items;
    }
    const checkouts = await this.userLibraryService.getActiveForUser(userId);
    const checkoutMap = new Map(
      checkouts.map((entry) => [entry.bookId, entry]),
    );
    const readMap = await this.userLibraryService.getReadMap(userId);
    const downloadMap = await this.offlineDownloadService.getStatusMap(
      userId,
      checkouts.map((entry) => entry.bookId),
    );
    return items.map((item) => {
      const checkout = checkoutMap.get(item.id);
      const readAt = readMap.get(item.id) ?? null;
      const downloadStatus = downloadMap.get(item.id) ?? null;
      return {
        ...item,
        checkedOutByMe: Boolean(checkout),
        checkedOutAt: checkout?.checkedOutAt ?? null,
        readByMe: Boolean(readAt),
        readAt,
        downloadStatus,
      };
    });
  }

  async getLibraryDetail(
    bookId: number,
    userId?: string,
  ): Promise<LibraryDetail> {
    this.logger.info('library_detail_open', {
      bookId,
      userId: userId ?? null,
    });
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

    const bookdarrCoverRaw = this.pickCoverPath(item.book?.images, item.bookId);
    let bookdarrCover = this.resolveCoverUrl(apiUrl, bookdarrCoverRaw);
    if (!bookdarrCover) {
      const bookResource = await this.bookdarrService.getBookResource(
        item.bookId,
      );
      const resourceCoverRaw = this.pickCoverPath(
        bookResource?.images,
        item.bookId,
      );
      bookdarrCover = this.resolveCoverUrl(apiUrl, resourceCoverRaw);
    }
    let bookdarrOverview: string | undefined;
    try {
      bookdarrOverview = await this.bookdarrService.getBookOverview(bookId);
    } catch {
      bookdarrOverview = undefined;
    }
    const overview = item.book?.overview || bookdarrOverview;
    const needsMetadata = !overview || overview.trim().length === 0;
    const needsCover = !bookdarrCover;

    let match;
    let details;
    if (needsMetadata || needsCover) {
      try {
        match = await this.openLibraryService.lookupByTitleAuthor(
          title,
          author,
        );
      } catch {
        match = undefined;
      }
      try {
        details = await this.openLibraryService.lookupDetails(match);
      } catch {
        details = undefined;
      }
    }

    const openLibraryCover = this.openLibraryService.buildCoverUrl(
      match?.coverId,
    );
    const coverUrl = bookdarrCover ?? openLibraryCover;

    let files: LibraryFile[] = [];
    try {
      const bookFiles = await this.bookdarrService.getBookFiles(bookId);
      files = bookFiles.map((file) => this.mapBookFile(file));
    } catch {
      files = [];
    }

    const audiobookFiles = files.filter(
      (file) => file.mediaType === 'audiobook',
    );
    const ebookFiles = files.filter((file) => file.mediaType === 'ebook');

    const checkout = userId
      ? await this.userLibraryService.getActiveByBookId(userId, bookId)
      : null;
    const readAt = userId
      ? await this.userLibraryService.getReadStatus(userId, bookId)
      : null;
    const downloadStatus = userId
      ? await this.offlineDownloadService.getStatusForBook(userId, bookId)
      : null;

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
      checkedOutByMe: Boolean(checkout),
      checkedOutAt: checkout?.checkedOutAt ?? null,
      readByMe: Boolean(readAt),
      readAt,
      downloadStatus,
      releaseDate: item.book?.releaseDate,
      description: normalizeBookDescription(overview || details?.description),
      subjects: details?.subjects,
      pageCount: details?.pageCount,
      files,
      audiobookFiles,
      ebookFiles,
    };
  }

  async refreshMetadata(
    bookId: number,
    userId?: string,
  ): Promise<LibraryDetail> {
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

    const bookdarrCoverRaw = this.pickCoverPath(item.book?.images, item.bookId);
    let bookdarrCover = this.resolveCoverUrl(apiUrl, bookdarrCoverRaw);
    if (!bookdarrCover) {
      const bookResource = await this.bookdarrService.getBookResource(
        item.bookId,
      );
      const resourceCoverRaw = this.pickCoverPath(
        bookResource?.images,
        item.bookId,
      );
      bookdarrCover = this.resolveCoverUrl(apiUrl, resourceCoverRaw);
    }
    const openLibraryCover = this.openLibraryService.buildCoverUrl(
      match?.coverId,
    );

    let files: LibraryFile[] = [];
    try {
      const bookFiles = await this.bookdarrService.getBookFiles(bookId);
      files = bookFiles.map((file) => this.mapBookFile(file));
    } catch {
      files = [];
    }

    const audiobookFiles = files.filter(
      (file) => file.mediaType === 'audiobook',
    );
    const ebookFiles = files.filter((file) => file.mediaType === 'ebook');

    const checkout = userId
      ? await this.userLibraryService.getActiveByBookId(userId, bookId)
      : null;
    const readAt = userId
      ? await this.userLibraryService.getReadStatus(userId, bookId)
      : null;
    const downloadStatus = userId
      ? await this.offlineDownloadService.getStatusForBook(userId, bookId)
      : null;

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
      checkedOutByMe: Boolean(checkout),
      checkedOutAt: checkout?.checkedOutAt ?? null,
      readByMe: Boolean(readAt),
      readAt,
      downloadStatus,
      releaseDate: item.book?.releaseDate,
      description: normalizeBookDescription(details?.description ?? item.book?.overview),
      subjects: details?.subjects,
      pageCount: details?.pageCount,
      files,
      audiobookFiles,
      ebookFiles,
    };
  }

  async checkoutBook(userId: string, bookId: number) {
    const detail = await this.getLibraryDetail(bookId, userId);
    if (!detail.hasEbook && !detail.hasAudiobook) {
      throw new NotFoundException('No media files available for this book.');
    }
    await this.userLibraryService.checkout(userId, bookId);
    await this.offlineDownloadService.queueBook(userId, bookId);
    return this.getLibraryDetail(bookId, userId);
  }

  async returnBook(userId: string, bookId: number) {
    await this.userLibraryService.returnBook(userId, bookId);
    await this.offlineDownloadService.removeBook(userId, bookId);
    return this.getLibraryDetail(bookId, userId);
  }

  async getOfflineManifest(userId: string, bookId: number) {
    const checkout = await this.userLibraryService.getActiveByBookId(
      userId,
      bookId,
    );
    if (!checkout) {
      throw new ForbiddenException(
        'Book must be checked out to download for offline use.',
      );
    }

    let bookFiles: BookdarrBookFileResource[] = [];
    try {
      bookFiles = await this.bookdarrService.getBookFiles(bookId);
    } catch {
      bookFiles = [];
    }

    const files = bookFiles
      .map((file) => this.mapBookFile(file))
      .filter(
        (file) => file.mediaType === 'ebook' || file.mediaType === 'audiobook',
      )
      .map((file) => ({
        fileId: file.id,
        url: file.streamUrl,
        bytesTotal: file.size ?? 0,
        mediaType: file.mediaType,
      }));

    this.logger.info('device_offline_manifest', {
      userId,
      bookId,
      fileCount: files.length,
    });
    return { bookId, files };
  }

  async setReadStatus(userId: string, bookId: number, read: boolean) {
    await this.userLibraryService.setReadStatus(userId, bookId, read);
    return this.getLibraryDetail(bookId, userId);
  }

  private async buildLibraryItems(): Promise<LibraryItem[]> {
    const bookPool = await this.bookdarrService.getBookPool();
    const apiUrl = await this.bookdarrService.getApiUrl();

    const items = await Promise.all(
      bookPool.map(async (item) => {
        const title = item.book?.title ?? 'Unknown title';
        const author =
          item.book?.author?.authorName ??
          item.book?.author?.authorNameLastFirst ??
          undefined;

        const bookdarrCoverRaw = this.pickCoverPath(
          item.book?.images,
          item.bookId,
        );
        let bookdarrCover = this.resolveCoverUrl(apiUrl, bookdarrCoverRaw);
        if (!bookdarrCover) {
          const bookResource = await this.bookdarrService.getBookResource(
            item.bookId,
          );
          const resourceCoverRaw = this.pickCoverPath(
            bookResource?.images,
            item.bookId,
          );
          bookdarrCover = this.resolveCoverUrl(apiUrl, resourceCoverRaw);
        }

        let match;
        if (!bookdarrCover) {
          try {
            match = await this.openLibraryService.lookupByTitleAuthor(
              title,
              author,
            );
          } catch {
            match = undefined;
          }
        }
        const openLibraryCover = this.openLibraryService.buildCoverUrl(
          match?.coverId,
        );
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

    return items.filter((item) => item.hasEbook || item.hasAudiobook);
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
      streamUrl: `/library/files/${file.id}/stream/${encodeURIComponent(fileName)}`,
    };
  }

  private getMediaType(
    file: BookdarrBookFileResource,
    format: string,
  ): LibraryMediaType {
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

    if (
      ['.mp3', '.m4b', '.m4a', '.aac', '.ogg', '.wav', '.flac'].includes(format)
    ) {
      return 'audiobook';
    }
    if (
      ['.epub', '.pdf', '.mobi', '.azw', '.azw3', '.cbz', '.cbr'].includes(
        format,
      )
    ) {
      return 'ebook';
    }

    return 'unknown';
  }

  private resolveCoverUrl(
    apiUrl: string,
    coverRaw?: string,
  ): string | undefined {
    if (!coverRaw || coverRaw.trim().length === 0) {
      return undefined;
    }
    try {
      const base = new URL(apiUrl);
      const resolved = new URL(coverRaw, apiUrl);
      if (resolved.origin === base.origin) {
        const path = resolved.pathname + resolved.search;
        return `/library/cover-image?path=${encodeURIComponent(path)}`;
      }
      return resolved.toString();
    } catch {
      return undefined;
    }
  }

  private pickCoverPath(
    images?: {
      remoteUrl?: string;
      url?: string;
      extension?: string;
      coverType?: string;
    }[],
    bookId?: number,
  ): string | undefined {
    if (!images || images.length === 0) {
      return undefined;
    }

    const normalize = (value?: string) => {
      if (typeof value !== 'string') {
        return undefined;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      if (trimmed.startsWith('MediaCover/')) {
        return `/${trimmed}`;
      }
      return trimmed;
    };

    const isUsable = (value?: string) =>
      typeof value === 'string' &&
      (value.startsWith('/') ||
        value.startsWith('http') ||
        value.startsWith('MediaCover/'));

    const hasImageExtension = (value?: string, extension?: string) => {
      if (extension && /\.(jpe?g|png|gif|webp)$/i.test(extension)) {
        return true;
      }
      return (
        typeof value === 'string' &&
        /\.(jpe?g|png|gif|webp)(\\?|$)/i.test(value)
      );
    };

    const preferred = images.filter((entry) =>
      entry.coverType ? entry.coverType.toLowerCase() === 'cover' : true,
    );

    for (const entry of preferred) {
      const url = normalize(entry.url);
      if (url && isUsable(url) && hasImageExtension(url, entry.extension)) {
        return url;
      }
      const remote = normalize(entry.remoteUrl);
      if (
        remote &&
        isUsable(remote) &&
        hasImageExtension(remote, entry.extension)
      ) {
        return remote;
      }
    }

    for (const entry of preferred) {
      const remote = normalize(entry.remoteUrl);
      if (
        remote &&
        remote.startsWith('http') &&
        hasImageExtension(remote, entry.extension)
      ) {
        return remote;
      }
    }

    if (bookId && preferred.length > 0) {
      return `/api/v1/mediacover/book/${bookId}/cover.jpg`;
    }

    return undefined;
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
