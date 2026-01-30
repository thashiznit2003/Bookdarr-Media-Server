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
  openLibrary?: {
    key?: string;
    editionKey?: string;
  };
}
