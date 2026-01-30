import { Injectable } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { PublicSettings, Settings } from './settings.types';

const DEFAULT_PORT = 9797;
const DEFAULT_DIAGNOSTICS_REPO = 'thashiznit2003/Bookdarr-Media-Diagnostics';
const DEFAULT_DIAGNOSTICS_BRANCH = 'main';
const DEFAULT_DIAGNOSTICS_PATH = 'bms';
const DEFAULT_AUTH_ACCESS_TTL = '15m';
const DEFAULT_AUTH_REFRESH_TTL = '30d';
const DEFAULT_AUTH_RESET_TTL_MINUTES = 30;
const DEFAULT_DB_TYPE = 'sqlite';
const DEFAULT_DB_PATH = 'data/bms.sqlite';

@Injectable()
export class SettingsService {
  private readonly settings: Settings;

  constructor() {
    this.settings = this.loadFromEnv();
  }

  getSettings(): Settings {
    return this.settings;
  }

  getPublicSettings(): PublicSettings {
    const smtpConfigured = Boolean(
      this.settings.smtp.host &&
        this.settings.smtp.port &&
        this.settings.smtp.user &&
        this.settings.smtp.pass,
    );
    const bookdarrConfigured = Boolean(
      this.settings.bookdarr.apiUrl && this.settings.bookdarr.apiKey,
    );
    const databaseConfigured =
      this.settings.database.type === 'sqlite'
        ? Boolean(this.settings.database.sqlitePath)
        : Boolean(
            this.settings.database.host &&
              this.settings.database.port &&
              this.settings.database.username &&
              this.settings.database.name,
          );
    const diagnosticsConfigured = Boolean(
      this.settings.diagnostics.repo && this.settings.diagnostics.token,
    );
    const authConfigured = Boolean(
      this.settings.auth.accessSecret && this.settings.auth.refreshSecret,
    );
    const inviteCodesConfigured = this.settings.auth.inviteCodes.length > 0;

    return {
      port: this.settings.port,
      bookdarr: {
        apiUrl: this.settings.bookdarr.apiUrl,
        configured: bookdarrConfigured,
      },
      database: {
        type: this.settings.database.type,
        configured: databaseConfigured,
        synchronize: this.settings.database.synchronize,
        sqlitePath: this.settings.database.sqlitePath,
        host: this.settings.database.host,
        port: this.settings.database.port,
        name: this.settings.database.name,
        ssl: this.settings.database.ssl,
      },
      smtp: {
        host: this.settings.smtp.host,
        port: this.settings.smtp.port,
        from: this.settings.smtp.from,
        configured: smtpConfigured,
      },
      diagnostics: {
        required: this.settings.diagnostics.required,
        configured: diagnosticsConfigured,
        repo: this.settings.diagnostics.repo,
        branch: this.settings.diagnostics.branch,
        path: this.settings.diagnostics.path,
      },
      auth: {
        configured: authConfigured,
        inviteRequired: true,
        inviteCodesConfigured,
        accessTokenTtl: this.settings.auth.accessTokenTtl,
        refreshTokenTtl: this.settings.auth.refreshTokenTtl,
        resetTokenTtlMinutes: this.settings.auth.resetTokenTtlMinutes,
      },
    };
  }

  private loadFromEnv(): Settings {
    const port = this.parsePort(process.env.PORT, DEFAULT_PORT, 'PORT');
    const smtpPort = this.parsePort(process.env.SMTP_PORT, undefined, 'SMTP_PORT');
    const diagnosticsRequired = this.parseBoolean(
      process.env.DIAGNOSTICS_REQUIRED,
      true,
    );
    const diagnosticsRepo = this.readEnv('DIAGNOSTICS_REPO');
    const diagnosticsBranch =
      this.readEnv('DIAGNOSTICS_BRANCH') ?? DEFAULT_DIAGNOSTICS_BRANCH;
    const diagnosticsPath =
      this.readEnv('DIAGNOSTICS_PATH') ?? DEFAULT_DIAGNOSTICS_PATH;
    const diagnosticsToken = this.readEnv('DIAGNOSTICS_TOKEN');
    const authAccessTtl =
      this.readEnv('JWT_ACCESS_TTL') ?? DEFAULT_AUTH_ACCESS_TTL;
    const authRefreshTtl =
      this.readEnv('JWT_REFRESH_TTL') ?? DEFAULT_AUTH_REFRESH_TTL;
    const resetTtlMinutes = this.parsePositiveInt(
      this.readEnv('RESET_TOKEN_TTL_MINUTES'),
      DEFAULT_AUTH_RESET_TTL_MINUTES,
      'RESET_TOKEN_TTL_MINUTES',
    );
    const inviteCodes = this.parseCsv(this.readEnv('INVITE_CODES'));
    const dbTypeRaw = this.readEnv('DB_TYPE') ?? DEFAULT_DB_TYPE;
    const dbType = this.parseDbType(dbTypeRaw);
    const dbSyncDefault = dbType === 'sqlite';
    const dbSync = this.parseBoolean(
      this.readEnv('DB_SYNC'),
      dbSyncDefault,
    );
    const dbPath = this.readEnv('DB_PATH') ?? DEFAULT_DB_PATH;
    if (dbType === 'sqlite') {
      this.ensureSqliteDirectory(dbPath);
    }
    const dbHost = this.readEnv('DB_HOST');
    const dbPort = this.parsePort(this.readEnv('DB_PORT'), undefined, 'DB_PORT');
    const dbUser = this.readEnv('DB_USER');
    const dbPass = this.readEnv('DB_PASS');
    const dbName = this.readEnv('DB_NAME');
    const dbSsl = this.parseBoolean(this.readEnv('DB_SSL'), false);

    const apiUrl = this.parseUrl(process.env.BOOKDARR_API_URL, 'BOOKDARR_API_URL');

    return {
      port,
      bookdarr: {
        apiUrl,
        apiKey: this.readEnv('BOOKDARR_API_KEY'),
      },
      database: {
        type: dbType,
        synchronize: dbSync,
        sqlitePath: dbType === 'sqlite' ? dbPath : undefined,
        host: dbType === 'postgres' ? dbHost : undefined,
        port: dbType === 'postgres' ? dbPort : undefined,
        username: dbType === 'postgres' ? dbUser : undefined,
        password: dbType === 'postgres' ? dbPass : undefined,
        name: dbType === 'postgres' ? dbName : undefined,
        ssl: dbType === 'postgres' ? dbSsl : undefined,
      },
      smtp: {
        host: this.readEnv('SMTP_HOST'),
        port: smtpPort,
        user: this.readEnv('SMTP_USER'),
        pass: this.readEnv('SMTP_PASS'),
        from: this.readEnv('SMTP_FROM'),
      },
      diagnostics: {
        required: diagnosticsRequired,
        repo: this.parseRepo(
          diagnosticsRepo ?? DEFAULT_DIAGNOSTICS_REPO,
          'DIAGNOSTICS_REPO',
        ),
        token: diagnosticsToken,
        branch: diagnosticsBranch,
        path: diagnosticsPath,
      },
      auth: {
        accessSecret: this.readEnv('JWT_ACCESS_SECRET'),
        refreshSecret: this.readEnv('JWT_REFRESH_SECRET'),
        accessTokenTtl: authAccessTtl,
        refreshTokenTtl: authRefreshTtl,
        resetTokenTtlMinutes: resetTtlMinutes,
        inviteCodes,
      },
    };
  }

  private readEnv(name: string): string | undefined {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value.trim() : undefined;
  }

  private parsePort(
    value: string | undefined,
    defaultValue: number | undefined,
    name: string,
  ): number | undefined {
    if (!value || value.trim().length === 0) {
      return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`${name} must be a valid TCP port (1-65535).`);
    }

    return parsed;
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value || value.trim().length === 0) {
      return defaultValue;
    }

    return ['1', 'true', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
  }

  private parseUrl(value: string | undefined, name: string): string | undefined {
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`${name} must be http or https.`);
      }
      return parsed.toString().replace(/\/$/, '');
    } catch {
      throw new Error(`${name} must be a valid URL.`);
    }
  }

  private parseRepo(value: string | undefined, name: string): string | undefined {
    if (!value || value.trim().length === 0) {
      return undefined;
    }

    const trimmed = value.trim();
    const isValid = /^[^/\s]+\/[^/\s]+$/.test(trimmed);
    if (!isValid) {
      throw new Error(`${name} must be in the form \"owner/repo\".`);
    }

    return trimmed;
  }

  private parseDbType(value: string): 'sqlite' | 'postgres' {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'sqlite' || normalized === 'postgres') {
      return normalized;
    }

    throw new Error('DB_TYPE must be sqlite or postgres.');
  }

  private ensureSqliteDirectory(dbPath: string) {
    if (dbPath === ':memory:') {
      return;
    }

    const folder = dirname(dbPath);
    if (!folder || folder === '.') {
      return;
    }

    mkdirSync(folder, { recursive: true });
  }

  private parsePositiveInt(
    value: string | undefined,
    defaultValue: number,
    name: string,
  ): number {
    if (!value || value.trim().length === 0) {
      return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`${name} must be a positive integer.`);
    }

    return parsed;
  }

  private parseCsv(value: string | undefined): string[] {
    if (!value || value.trim().length === 0) {
      return [];
    }

    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
}
