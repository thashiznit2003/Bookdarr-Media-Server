import { Injectable } from '@nestjs/common';
import { BookdarrService } from '../bookdarr/bookdarr.service';
import { OpenLibraryService } from '../openlibrary/openlibrary.service';
import { LibraryItem } from './library.types';

@Injectable()
export class LibraryService {
  constructor(
    private readonly bookdarrService: BookdarrService,
    private readonly openLibraryService: OpenLibraryService,
  ) {}

  async getLibrary(): Promise<LibraryItem[]> {
    const bookPool = await this.bookdarrService.getBookPool();

    const items = await Promise.all(
      bookPool.map(async (item) => {
        const title = item.book?.title ?? 'Unknown title';
        const author =
          item.book?.author?.authorName ??
          item.book?.author?.authorNameLastFirst ??
          undefined;

        const match = await this.openLibraryService.lookupByTitleAuthor(
          title,
          author,
        );
        const openLibraryCover = this.openLibraryService.buildCoverUrl(
          match?.coverId,
        );
        const bookdarrCover =
          item.book?.images?.find((image) => image.remoteUrl || image.url)
            ?.remoteUrl ??
          item.book?.images?.find((image) => image.url)?.url;
        const coverUrl = openLibraryCover ?? bookdarrCover;

        return {
          id: item.bookId,
          title: match?.title ?? title,
          author: match?.author ?? author,
          publishYear: match?.publishYear,
          overview: item.book?.overview,
          coverUrl,
          bookdarrStatus: item.status,
          hasEbook: item.hasEbook,
          hasAudiobook: item.hasAudiobook,
          inMyLibrary: item.inMyLibrary,
          openLibrary: {
            key: match?.key,
            editionKey: match?.editionKey,
          },
        };
      }),
    );

    return items;
  }
}
