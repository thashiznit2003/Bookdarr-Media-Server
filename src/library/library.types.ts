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
  readByMe?: boolean;
  readAt?: string | null;
  downloadStatus?: OfflineDownloadStatus | null;
  openLibrary?: {
    key?: string;
    editionKey?: string;
  };
}

export interface OfflineDownloadStatus {
  status: 'not_started' | 'queued' | 'downloading' | 'ready' | 'failed';
  bytesTotal: number;
  bytesDownloaded: number;
  progress: number;
  fileCount: number;
  readyCount: number;
  failedCount: number;
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
