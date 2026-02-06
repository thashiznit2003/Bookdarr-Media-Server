import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { LibraryItem } from './library.types';

const CACHE_VERSION = 2;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface LibraryCachePayload {
  version: number;
  configKey: string;
  updatedAt: string;
  items: LibraryItem[];
}

@Injectable()
export class LibraryCacheService {
  private readonly cachePath = join(
    process.cwd(),
    'data',
    'library-cache.json',
  );

  async getCached(configKey: string): Promise<LibraryItem[] | null> {
    try {
      const raw = await readFile(this.cachePath, 'utf-8');
      const payload = JSON.parse(raw) as LibraryCachePayload;
      if (!payload || payload.version !== CACHE_VERSION) {
        return null;
      }
      if (payload.configKey !== configKey) {
        return null;
      }
      const updatedAt = Date.parse(payload.updatedAt ?? '');
      if (!updatedAt || Date.now() - updatedAt > CACHE_TTL_MS) {
        return null;
      }
      if (!Array.isArray(payload.items)) {
        return null;
      }
      return payload.items;
    } catch {
      return null;
    }
  }

  async setCached(configKey: string, items: LibraryItem[]): Promise<void> {
    try {
      await mkdir(dirname(this.cachePath), { recursive: true });
      const payload: LibraryCachePayload = {
        version: CACHE_VERSION,
        configKey,
        updatedAt: new Date().toISOString(),
        items,
      };
      await writeFile(
        this.cachePath,
        JSON.stringify(payload, null, 2),
        'utf-8',
      );
    } catch {
      // ignore cache write failures
    }
  }

  async clearCached(): Promise<void> {
    try {
      await rm(this.cachePath, { force: true });
    } catch {
      // ignore cache clear failures
    }
  }
}
