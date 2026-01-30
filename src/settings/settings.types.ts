export interface Settings {
  port: number;
  bookdarr: {
    apiUrl?: string;
    apiKey?: string;
  };
  smtp: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
  };
  diagnostics: {
    required: boolean;
    repo?: string;
    token?: string;
    branch: string;
    path: string;
  };
}

export interface PublicSettings {
  port: number;
  bookdarr: {
    apiUrl?: string;
    configured: boolean;
  };
  smtp: {
    host?: string;
    port?: number;
    from?: string;
    configured: boolean;
  };
  diagnostics: {
    required: boolean;
    configured: boolean;
    repo?: string;
    branch: string;
    path: string;
  };
}
