import { Injectable } from '@nestjs/common';
import { PublicSettings, Settings } from './settings.types';

const DEFAULT_PORT = 9797;

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

    return {
      port: this.settings.port,
      bookdarr: {
        apiUrl: this.settings.bookdarr.apiUrl,
        configured: bookdarrConfigured,
      },
      smtp: {
        host: this.settings.smtp.host,
        port: this.settings.smtp.port,
        from: this.settings.smtp.from,
        configured: smtpConfigured,
      },
      diagnostics: {
        required: this.settings.diagnostics.required,
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

    const apiUrl = this.parseUrl(process.env.BOOKDARR_API_URL, 'BOOKDARR_API_URL');

    return {
      port,
      bookdarr: {
        apiUrl,
        apiKey: this.readEnv('BOOKDARR_API_KEY'),
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
}
