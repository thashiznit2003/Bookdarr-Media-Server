import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { existsSync } from 'fs';
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { FileLoggerService } from '../src/logging/file-logger.service';
import { HttpExceptionFilter } from '../src/logging/http-exception.filter';
import { RequestIdMiddleware } from '../src/logging/request-id.middleware';

// Minimal contract tests for /api/v1/* so we can start the mobile app with confidence.
// These tests run with an isolated SQLite DB and stubbed Bookdarr fetch responses.

describe('API v1 contract', () => {
  let app: INestApplication;
  let httpServer: any;
  let dbPath: string;
  let accessToken: string;
  let refreshToken: string;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    // Isolated settings for the test run (no external dependencies).
    dbPath = join(tmpdir(), `bms-e2e-${randomUUID()}.sqlite`);
    // PORT is not used (we don't call app.listen in tests), but SettingsService validates it.
    process.env.PORT = '9797';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = dbPath;
    process.env.DB_SYNC = 'true';
    process.env.DB_MIGRATIONS = 'false';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.BOOKDARR_API_URL = 'http://bookdarr.local';
    process.env.BOOKDARR_API_KEY = 'test-bookdarr-key';

    // Stub Bookdarr API calls so /api/v1/library works without a real Bookdarr.
    global.fetch = (async (input: any) => {
      const url = typeof input === 'string' ? input : String(input?.url ?? '');
      if (url === 'http://bookdarr.local/api/v1/user/library/pool') {
        const body = [
          {
            bookId: 1,
            status: 'Available',
            hasEbook: true,
            hasAudiobook: false,
            inMyLibrary: false,
            book: {
              id: 1,
              title: 'Test Book',
              author: { authorName: 'Test Author' },
              releaseDate: '2020-01-01',
              overview: 'Test overview.',
              images: [{ coverType: 'Cover', url: '/MediaCover/1/cover.jpg' }],
            },
          },
        ];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url === 'http://bookdarr.local/api/v1/bookfile?bookId=1') {
        const body = [
          {
            id: 10,
            bookId: 1,
            path: '/books/Test Book.epub',
            size: 1234,
            mediaType: 1,
          },
        ];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      // Unknown fetches should fail fast so tests don't silently hit the network.
      return new Response('not found', { status: 404 });
    }) as any;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // main.ts wires this in production; install it here so contract tests catch regressions.
    const requestId = new RequestIdMiddleware();
    app.use(requestId.use.bind(requestId));
    app.useGlobalFilters(new HttpExceptionFilter(app.get(FileLoggerService)));
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    global.fetch = originalFetch as any;
    if (app) {
      await app.close();
    }
    if (dbPath && existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
  });

  it('can setup first user', async () => {
    const response = await request(httpServer)
      .post('/auth/setup')
      .send({ username: 'admin', email: 'admin@example.com', password: 'password123' })
      .expect(201);

    expect(response.body?.user?.username).toBe('admin');
    expect(typeof response.body?.tokens?.accessToken).toBe('string');
    expect(typeof response.body?.tokens?.refreshToken).toBe('string');
  });

  it('can login via /api/v1/auth/login and access /api/v1/me', async () => {
    const login = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);

    accessToken = login.body?.tokens?.accessToken;
    refreshToken = login.body?.tokens?.refreshToken;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const me = await request(httpServer)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body?.username).toBe('admin');
    expect(me.body?.email).toBe('admin@example.com');
  });

  it('can refresh and rejects refresh token reuse', async () => {
    const first = await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    const nextRefresh = first.body?.tokens?.refreshToken;
    expect(typeof first.body?.tokens?.accessToken).toBe('string');
    expect(typeof nextRefresh).toBe('string');

    // Refresh tokens are one-time use.
    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // Reuse detection revokes sessions and bumps tokenVersion, so we need to re-login.
    const relogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    accessToken = relogin.body?.tokens?.accessToken;
    refreshToken = relogin.body?.tokens?.refreshToken;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('can fetch /api/v1/library', async () => {
    const response = await request(httpServer)
      .get('/api/v1/library')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(typeof response.headers['x-request-id']).toBe('string');
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]?.title).toBe('Test Book');
  });

  it('offline manifest uses versioned stream URLs under /api/v1/', async () => {
    // Checkout is required for offline manifest.
    await request(httpServer)
      .post('/api/v1/library/1/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const manifest = await request(httpServer)
      .get('/api/v1/library/1/offline-manifest')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(manifest.body?.bookId).toBe(1);
    expect(Array.isArray(manifest.body?.files)).toBe(true);
    expect(manifest.body.files.length).toBeGreaterThan(0);
    expect(String(manifest.body.files[0]?.url)).toMatch(/^\/api\/v1\/library\/files\//);
  });

  it('non-admin users are forbidden from admin endpoints and admin pages (no forced logout)', async () => {
    // Create a non-admin user using the admin-only API.
    await request(httpServer)
      .post('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: 'user1', email: 'user1@example.com', password: 'password123', isAdmin: false })
      .expect(201);

    const loginUser = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'user1', password: 'password123' })
      .expect(201);

    const userToken = loginUser.body?.tokens?.accessToken as string;
    expect(typeof userToken).toBe('string');

    await request(httpServer)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(httpServer)
      .post('/api/v1/library/admin/clear-cache')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    // Visiting the Accounts page should be a 403, not a redirect-to-login.
    const accounts = await request(httpServer)
      .get('/accounts')
      .set('Cookie', [`bmsAccessToken=${encodeURIComponent(userToken)}`])
      .expect(403);
    expect(String(accounts.text)).toContain('Not authorized');

    // User remains authenticated for normal endpoints.
    await request(httpServer)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });
});
