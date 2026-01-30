export interface BookdarrBookImage {
  coverType?: string;
  url?: string;
  remoteUrl?: string;
}

export interface BookdarrBookPoolItem {
  bookId: number;
  status: string;
  hasEbook: boolean;
  hasAudiobook: boolean;
  inMyLibrary: boolean;
  book?: {
    id?: number;
    title?: string;
    author?: {
      authorName?: string;
      authorNameLastFirst?: string;
    };
    releaseDate?: string;
    overview?: string;
    images?: BookdarrBookImage[];
  };
}

export interface BookdarrBookPoolResponse extends Array<BookdarrBookPoolItem> {}

export interface BookdarrBookResource {
  id?: number;
  title?: string;
  overview?: string;
  images?: BookdarrBookImage[];
}

export interface BookdarrBookResponse extends Array<BookdarrBookResource> {}

export interface BookdarrBookFileResource {
  id: number;
  bookId: number;
  path?: string;
  size?: number;
  mediaType?: number | string;
  quality?: unknown;
  dateAdded?: string;
}

export interface BookdarrBookFilesResponse extends Array<BookdarrBookFileResource> {}
