export interface OpenLibrarySearchResult {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_key?: string[];
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchResult[];
}

export interface OpenLibraryMatch {
  title?: string;
  author?: string;
  publishYear?: number;
  coverId?: number;
  key?: string;
  editionKey?: string;
}
