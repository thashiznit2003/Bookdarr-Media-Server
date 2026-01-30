import { Injectable } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { appendFile } from 'fs/promises';
import { join } from 'path';

type LogLevel = 'info' | 'warn' | 'error';

@Injectable()
export class FileLoggerService {
  private readonly logDir: string;
  private readonly logFile: string;

  constructor() {
    const baseDir = process.env.LOG_DIR ?? join(process.cwd(), 'data', 'logs');
    this.logDir = baseDir;
    this.logFile = join(baseDir, 'bms.log');
    mkdirSync(this.logDir, { recursive: true });
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: meta ?? null,
    };

    appendFile(this.logFile, JSON.stringify(entry) + '\n').catch(() => {
      // Swallow logging errors to avoid crashing the app.
    });
  }
}
