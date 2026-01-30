export interface Settings {
  port: number;
  bookdarr: {
    apiUrl?: string;
    apiKey?: string;
    poolPath?: string;
  };
  database: {
    type: 'sqlite' | 'postgres';
    synchronize: boolean;
    sqlitePath?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    name?: string;
    ssl?: boolean;
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
  auth: {
    accessSecret?: string;
    refreshSecret?: string;
    accessTokenTtl: string;
    refreshTokenTtl: string;
    resetTokenTtlMinutes: number;
    inviteCodes: string[];
  };
  openLibrary: {
    baseUrl: string;
  };
}

export interface PublicSettings {
  port: number;
  bookdarr: {
    apiUrl?: string;
    configured: boolean;
    poolPath?: string;
  };
  database: {
    type: 'sqlite' | 'postgres';
    configured: boolean;
    synchronize: boolean;
    sqlitePath?: string;
    host?: string;
    port?: number;
    name?: string;
    ssl?: boolean;
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
  auth: {
    configured: boolean;
    inviteRequired: boolean;
    inviteCodesConfigured: boolean;
    accessTokenTtl: string;
    refreshTokenTtl: string;
    resetTokenTtlMinutes: number;
  };
  openLibrary: {
    baseUrl: string;
  };
}
