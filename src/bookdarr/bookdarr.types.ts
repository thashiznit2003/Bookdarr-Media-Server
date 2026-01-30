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
