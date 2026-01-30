export interface LibraryItem {
  id: number;
  title: string;
  author?: string;
  publishYear?: number;
  overview?: string;
  coverUrl?: string;
  bookdarrStatus?: string;
  hasEbook: boolean;
  hasAudiobook: boolean;
  inMyLibrary: boolean;
  checkedOutByMe?: boolean;
  checkedOutAt?: string | null;
  openLibrary?: {
    key?: string;
    editionKey?: string;
  };
}

export type LibraryMediaType = 'audiobook' | 'ebook' | 'unknown';

export interface LibraryFile {
  id: number;
  fileName: string;
  size: number;
  mediaType: LibraryMediaType;
  format?: string;
  streamUrl: string;
}

export interface LibraryDetail extends LibraryItem {
  releaseDate?: string;
  description?: string;
  subjects?: string[];
  pageCount?: number;
  files: LibraryFile[];
  audiobookFiles: LibraryFile[];
  ebookFiles: LibraryFile[];
}
