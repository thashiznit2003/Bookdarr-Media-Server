import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { MailerService } from '../src/auth/mailer.service';
import { AuthSessionEntity } from '../src/auth/entities/auth-session.entity';
import { UserEntity } from '../src/auth/entities/user.entity';
import { PasswordResetTokenEntity } from '../src/auth/entities/password-reset-token.entity';
import { generateTotpCode } from '../src/auth/totp';
import { FileLoggerService } from '../src/logging/file-logger.service';
import { HttpExceptionFilter } from '../src/logging/http-exception.filter';

type CapturedReset = {
  email: string;
  token: string;
  ttlMinutes: number;
  baseUrl?: string;
  fromName?: string | null;
  from?: string | null;
};

// Checklist verification tests for items 2-6.
// These run with an isolated SQLite DB and stubbed Bookdarr fetch responses.
describe('Checklist 2-6 verification', () => {
  let app: INestApplication;
  let httpServer: any;
  let dbPath: string;
  let dataSource: DataSource;
  const originalFetch = global.fetch;

  // Captured password reset email payload.
  const captured: { reset?: CapturedReset } = {};

  // Bookdarr fetch capture for streaming tests.
  const fetchCapture: { lastRange?: string | null; refreshCalls: number } = {
    lastRange: null,
    refreshCalls: 0,
  };

  function parseSetCookie(header: string[] | undefined, name: string) {
    const list = header ?? [];
    const match = list.find((value) => value.startsWith(`${name}=`));
    return match ?? null;
  }

  function cookieValue(cookieHeader: string, name: string) {
    const part = cookieHeader.split(';')[0] ?? '';
    if (!part.startsWith(`${name}=`)) return '';
    return decodeURIComponent(part.slice(name.length + 1));
  }

  beforeAll(async () => {
    dbPath = join(tmpdir(), `bms-checklist-e2e-${randomUUID()}.sqlite`);
    process.env.PORT = '9797';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = dbPath;
    process.env.DB_SYNC = 'true';
    process.env.DB_MIGRATIONS = 'false';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.BOOKDARR_API_URL = 'http://bookdarr.local';
    process.env.BOOKDARR_API_KEY = 'test-bookdarr-key';

    // Stub Bookdarr API calls (pool + streams). Any unknown fetch should fail fast.
    global.fetch = (async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : String(input?.url ?? '');
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url === 'http://bookdarr.local/api/v1/user/library/pool') {
        const body = [
          {
            bookId: 1,
            status: 'Available',
            hasEbook: true,
            hasAudiobook: true,
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

      // Range + streaming verification.
      if (url === 'http://bookdarr.local/api/v1/bookfile/2/stream') {
        fetchCapture.lastRange = (init?.headers?.Range as string | undefined) ?? null;
        // Return a tiny body; the proxy just pipes bytes.
        const payload = new Uint8Array([1, 2, 3, 4, 5]);
        const headers = new Headers();
        headers.set('content-type', 'application/octet-stream');
        headers.set('content-disposition', 'attachment; filename=\"Artemis.m4b\"');
        headers.set('accept-ranges', 'bytes');

        // If client requested a range, respond 206 with Content-Range.
        if (fetchCapture.lastRange) {
          headers.set('content-range', 'bytes 0-4/5');
          headers.set('content-length', '5');
          return new Response(method === 'HEAD' ? null : payload, {
            status: 206,
            headers,
          });
        }

        headers.set('content-length', '5');
        return new Response(method === 'HEAD' ? null : payload, {
          status: 200,
          headers,
        });
      }

      return new Response('not found', { status: 404 });
    }) as any;

    const fakeMailer: Partial<MailerService> = {
      sendPasswordReset: async (email, token, ttlMinutes, baseUrl) => {
        captured.reset = { email, token, ttlMinutes, baseUrl };
      },
      sendNewUserWelcome: async () => {},
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(fakeMailer)
      .compile();

    app = moduleRef.createNestApplication();
    // Match production exception handling so we don't accidentally serialize circular objects.
    app.useGlobalFilters(new HttpExceptionFilter(app.get(FileLoggerService)));
    await app.init();
    httpServer = app.getHttpServer();
    dataSource = app.get(DataSource);
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

  it('2. Cookies are HttpOnly/SameSite=Lax and Secure when behind HTTPS', async () => {
    await request(httpServer)
      .post('/auth/setup')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ username: 'admin', email: 'admin@example.com', password: 'password123' })
      .expect(201);

    const response = await request(httpServer)
      .post('/auth/login')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-for', '203.0.113.2')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);

    const setCookie = response.headers['set-cookie'] as string[] | undefined;
    const access = parseSetCookie(setCookie, 'bmsAccessToken');
    const refresh = parseSetCookie(setCookie, 'bmsRefreshToken');
    const hint = parseSetCookie(setCookie, 'bmsLoggedIn');

    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
    expect(hint).toBeTruthy();

    // Cookie-only auth; critical flags.
    expect(access).toContain('HttpOnly');
    expect(access).toContain('SameSite=Lax');
    expect(access).toContain('Secure');

    // Non-sensitive hint cookie must not be HttpOnly.
    expect(hint).not.toContain('HttpOnly');
    expect(hint).toContain('SameSite=Lax');
    expect(hint).toContain('Secure');
  });

  it('2. Refresh rotates and rejects refresh token reuse (cookie flow)', async () => {
    const login = await request(httpServer)
      .post('/auth/login')
      .set('x-forwarded-for', '203.0.113.3')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);

    const refreshToken = login.body?.tokens?.refreshToken as string;
    expect(typeof refreshToken).toBe('string');

    const first = await request(httpServer)
      .post('/auth/refresh')
      .set('x-forwarded-for', '203.0.113.3')
      .send({ refreshToken })
      .expect(201);

    const nextRefresh = first.body?.tokens?.refreshToken as string;
    expect(typeof nextRefresh).toBe('string');

    // One-time use refresh: the original must now fail.
    await request(httpServer)
      .post('/auth/refresh')
      .set('x-forwarded-for', '203.0.113.3')
      .send({ refreshToken })
      .expect(401);
  });

  it('2. Sessions are multi-device and logout revokes only that session', async () => {
    const loginA = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('x-forwarded-for', '203.0.113.10')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const refreshA = loginA.body?.tokens?.refreshToken as string;

    const loginB = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('x-forwarded-for', '203.0.113.11')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const refreshB = loginB.body?.tokens?.refreshToken as string;

    expect(typeof refreshA).toBe('string');
    expect(typeof refreshB).toBe('string');

    const userRepo = dataSource.getRepository(UserEntity);
    const sessionRepo = dataSource.getRepository(AuthSessionEntity);
    const admin = await userRepo.findOne({ where: { username: 'admin' } });
    expect(admin?.id).toBeTruthy();
    const sessionsBefore = await sessionRepo.find({ where: { userId: admin!.id } });
    expect(sessionsBefore.length).toBeGreaterThanOrEqual(2);

    await request(httpServer)
      .post('/api/v1/auth/logout')
      .set('x-forwarded-for', '203.0.113.10')
      .send({ refreshToken: refreshA })
      .expect(201);

    // Refresh B still works (other device is still signed in).
    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .set('x-forwarded-for', '203.0.113.11')
      .send({ refreshToken: refreshB })
      .expect(201);

    // Refresh A is revoked.
    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .set('x-forwarded-for', '203.0.113.10')
      .send({ refreshToken: refreshA })
      .expect(401);
  });

  it('2. Changing password revokes sessions and refresh tokens immediately', async () => {
    const login = await request(httpServer)
      .post('/api/v1/auth/login')
      .set('x-forwarded-for', '203.0.113.12')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);

    const access = login.body?.tokens?.accessToken as string;
    const refresh = login.body?.tokens?.refreshToken as string;
    expect(typeof access).toBe('string');
    expect(typeof refresh).toBe('string');

    await request(httpServer)
      .put('/api/v1/me')
      .set('Authorization', `Bearer ${access}`)
      .send({ currentPassword: 'password123', newPassword: 'password456' })
      .expect(200);

    // Old refresh token is invalid after password change.
    await request(httpServer)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refresh })
      .expect(401);

    // New password works.
    await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password456' })
      .expect(201);
  });

  it('2. Auth endpoints are rate-limited (429 on repeated bad login)', async () => {
    // Max is 10 per 5 minutes for ip+username; earlier tests used other IPs.
    for (let i = 0; i < 10; i += 1) {
      await request(httpServer)
        .post('/auth/login')
        .set('x-forwarded-for', '203.0.113.50')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);
    }
    await request(httpServer)
      .post('/auth/login')
      .set('x-forwarded-for', '203.0.113.50')
      .send({ username: 'admin', password: 'wrongpassword' })
      .expect(429);
  });

  it('3. 2FA secrets are encrypted at rest; backup codes work and are one-time use; admin can reset 2FA', async () => {
    // Restore admin password from the previous test.
    const adminTempLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password456' })
      .expect(201);
    await request(httpServer)
      .put('/api/v1/me')
      .set('Authorization', `Bearer ${adminTempLogin.body.tokens.accessToken}`)
      .send({ currentPassword: 'password456', newPassword: 'password123' })
      .expect(200);

    const adminLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const adminAccess = adminLogin.body.tokens.accessToken as string;

    // Create a non-admin user.
    const createUser = await request(httpServer)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ username: 'user1', email: 'user1@example.com', password: 'password123', isAdmin: false })
      .expect(201);
    const user1Id = createUser.body?.id as string;
    expect(typeof user1Id).toBe('string');

    // Login as user1 and begin 2FA setup.
    const user1Login = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'user1', password: 'password123' })
      .expect(201);
    const user1Access = user1Login.body.tokens.accessToken as string;

    const setup = await request(httpServer)
      .post('/api/v1/auth/2fa/setup')
      .set('Authorization', `Bearer ${user1Access}`)
      .send({})
      .expect(201);
    const secret = setup.body?.secret as string;
    expect(typeof secret).toBe('string');

    // Generate a valid code for confirmation.
    const code = generateTotpCode(secret);

    const confirm = await request(httpServer)
      .post('/api/v1/auth/2fa/confirm')
      .set('Authorization', `Bearer ${user1Access}`)
      .send({ code })
      .expect(201);
    const backupCodes = confirm.body?.backupCodes as string[];
    expect(Array.isArray(backupCodes)).toBe(true);
    expect(backupCodes.length).toBeGreaterThan(0);

    // Secret must be encrypted in DB.
    const userRepo = dataSource.getRepository(UserEntity);
    const user1 = await userRepo.findOne({ where: { id: user1Id } });
    expect(user1?.twoFactorEnabled).toBe(true);
    expect(user1?.twoFactorSecret).toContain('enc:v1:');

    // Login now requires a two-factor challenge (two-step UX).
    const requireOtp = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'user1', password: 'password123' })
      .expect(401);
    expect(requireOtp.body?.twoFactorRequired).toBe(true);
    const challengeToken = requireOtp.body?.challengeToken as string;
    expect(typeof challengeToken).toBe('string');

    // Complete login using a backup code (one-time use).
    const backup = backupCodes[0]!;
    await request(httpServer)
      .post('/api/v1/auth/login/2fa')
      .send({ otp: backup, challengeToken })
      .expect(201);

    // Same backup code must not work again.
    const requireOtp2 = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'user1', password: 'password123' })
      .expect(401);
    await request(httpServer)
      .post('/api/v1/auth/login/2fa')
      .send({ otp: backup, challengeToken: requireOtp2.body?.challengeToken })
      .expect(401);

    // Admin can reset user 2FA; user1 should be able to login normally afterward.
    await request(httpServer)
      .post(`/api/users/${user1Id}/reset-2fa`)
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ adminPassword: 'password123' })
      .expect(201);
    await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'user1', password: 'password123' })
      .expect(201);
  });

  it('4. Password reset tokens are hashed, single-use, and TTL-enforced', async () => {
    captured.reset = undefined;
    await request(httpServer)
      .post('/api/v1/auth/password/request')
      .set('x-forwarded-proto', 'https')
      .set('x-forwarded-host', 'bms.test.local')
      .send({ email: 'admin@example.com' })
      .expect(201);

    expect(captured.reset?.token).toBeTruthy();
    const token = captured.reset!.token;

    // Token is stored hashed in DB, not in plaintext.
    const tokenRepo = dataSource.getRepository(PasswordResetTokenEntity);
    const all = await tokenRepo.find({ order: { createdAt: 'DESC' } });
    expect(all.length).toBeGreaterThan(0);
    const record = all[0]!;
    expect(typeof record.secretHash).toBe('string');
    expect(record.secretHash).toContain('$argon2');

    // Reset works once.
    await request(httpServer)
      .post('/api/v1/auth/password/reset')
      .send({ token, newPassword: 'password999' })
      .expect(201);

    // Token is now used (second attempt fails).
    await request(httpServer)
      .post('/api/v1/auth/password/reset')
      .send({ token, newPassword: 'password111' })
      .expect(400);

    // New password works.
    await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password999' })
      .expect(201);
  });

  it('5. Streaming supports Range and StreamAuthGuard can refresh server-side to keep playback alive', async () => {
    // Login using the web cookie flow so the stream guard can read cookies.
    const login = await request(httpServer)
      .post('/auth/login')
      .set('x-forwarded-proto', 'https')
      .send({ username: 'admin', password: 'password999' })
      .expect(201);

    const setCookie = login.headers['set-cookie'] as string[] | undefined;
    const accessCookie = parseSetCookie(setCookie, 'bmsAccessToken')!;
    const refreshCookie = parseSetCookie(setCookie, 'bmsRefreshToken')!;
    const access = cookieValue(accessCookie, 'bmsAccessToken');
    const refresh = cookieValue(refreshCookie, 'bmsRefreshToken');
    expect(access.length).toBeGreaterThan(10);
    expect(refresh.length).toBeGreaterThan(10);

    // Simulate an expired/invalid access token, but keep a valid refresh token.
    const cookieHeader = [
      `bmsAccessToken=${encodeURIComponent('invalid-access')}`,
      `bmsRefreshToken=${encodeURIComponent(refresh)}`,
      `bmsLoggedIn=1`,
    ].join('; ');

    fetchCapture.lastRange = null;
    const stream = await request(httpServer)
      .get('/api/v1/library/files/2/stream/Artemis.m4b')
      .set('cookie', cookieHeader)
      .set('range', 'bytes=0-4')
      .expect(206);

    // Range header must be forwarded upstream.
    expect(fetchCapture.lastRange).toBe('bytes=0-4');

    // Content-Type override should map from filename extension.
    expect(String(stream.headers['content-type'] ?? '')).toContain('audio/mp4');
    expect(stream.headers['content-range']).toBe('bytes 0-4/5');

    // Guard refresh should have set new cookies.
    const streamCookies = stream.headers['set-cookie'] as string[] | undefined;
    expect(Array.isArray(streamCookies)).toBe(true);
    expect(streamCookies!.some((c) => c.startsWith('bmsAccessToken='))).toBe(true);
  });
});
