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
    images?: Array<{ coverType?: string; url?: string; remoteUrl?: string }>; 
  };
}

export interface BookdarrBookPoolResponse extends Array<BookdarrBookPoolItem> {}

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
