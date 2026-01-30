import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { DiagnosticsPayload, DiagnosticsResult } from './diagnostics.types';
import { FileLoggerService } from '../logging/file-logger.service';

interface DiagnosticsConfig {
  required: boolean;
  repo?: string;
  token?: string;
  branch: string;
  path: string;
}

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly logger: FileLoggerService,
  ) {}

  async push(payload: DiagnosticsPayload): Promise<DiagnosticsResult> {
    if (!payload || !payload.event || payload.event.trim().length === 0) {
      throw new BadRequestException('Diagnostics event is required.');
    }

    const diagnostics = this.getDiagnosticsConfig();
    const configured = Boolean(diagnostics.repo && diagnostics.token);

    if (!configured) {
      if (diagnostics.required) {
        throw new ServiceUnavailableException(
          'Diagnostics are required but not configured.',
        );
      }
      this.logger.warn('diagnostics_skipped', {
        reason: 'not_configured',
        event: payload.event,
      });
      return { status: 'skipped', reason: 'not_configured' };
    }

    const fileName = this.buildDiagnosticsFileName(payload);
    const path = `${diagnostics.path}/${fileName}`;
    const body = this.buildDiagnosticsBody(payload);

    this.logger.info('diagnostics_push_start', {
      event: payload.event,
      path,
    });

    await this.pushToGithub({
      repo: diagnostics.repo as string,
      token: diagnostics.token as string,
      branch: diagnostics.branch,
      path,
      body,
    });

    this.logger.info('diagnostics_push_success', {
      event: payload.event,
      path,
    });

    return { status: 'pushed', path };
  }

  private getDiagnosticsConfig(): DiagnosticsConfig {
    const settings = this.settingsService.getSettings();
    return {
      required: settings.diagnostics.required,
      repo: settings.diagnostics.repo,
      token: settings.diagnostics.token,
      branch: settings.diagnostics.branch,
      path: settings.diagnostics.path,
    };
  }

  private buildDiagnosticsFileName(payload: DiagnosticsPayload): string {
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${this.pad(
      now.getUTCMonth() + 1,
    )}${this.pad(now.getUTCDate())}-${this.pad(
      now.getUTCHours(),
    )}${this.pad(now.getUTCMinutes())}${this.pad(now.getUTCSeconds())}`;
    const nonce = Math.random().toString(36).slice(2, 8);
    const safeEvent = payload.event.trim().replace(/[^a-zA-Z0-9-_]+/g, '-');
    return `diagnostics-${stamp}-${safeEvent}-${nonce}.json`;
  }

  private buildDiagnosticsBody(payload: DiagnosticsPayload) {
    return {
      source: payload.source ?? 'bms',
      event: payload.event.trim(),
      level: payload.level ?? 'info',
      receivedAt: new Date().toISOString(),
      data: payload.data ?? null,
      runtime: {
        node: process.version,
        env: process.env.NODE_ENV ?? 'development',
      },
    };
  }

  private async pushToGithub(params: {
    repo: string;
    token: string;
    branch: string;
    path: string;
    body: Record<string, unknown>;
  }): Promise<void> {
    const content = Buffer.from(
      JSON.stringify(params.body, null, 2),
      'utf8',
    ).toString('base64');

    const response = await fetch(
      `https://api.github.com/repos/${params.repo}/contents/${params.path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${params.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'bookdarr-media-server',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `bms diagnostics: ${params.body.event}`,
          content,
          branch: params.branch,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('diagnostics_push_failed', {
        status: response.status,
        path: params.path,
        error: errorText,
      });
      throw new ServiceUnavailableException(
        `Diagnostics push failed (${response.status}). ${errorText}`,
      );
    }
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
