import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FileLoggerService } from '../src/logging/file-logger.service';
import { HttpExceptionFilter } from '../src/logging/http-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.INVITE_CODES = 'TESTINVITE';
    process.env.DIAGNOSTICS_REQUIRED = 'false';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = ':memory:';
    process.env.DB_SYNC = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter(app.get(FileLoggerService)));
    await app.init();

    const setupStatus = await request(app.getHttpServer())
      .get('/auth/setup')
      .expect(200);
    expect(setupStatus.body.required).toBe(true);

    const setupResponse = await request(app.getHttpServer())
      .post('/auth/setup')
      .send({
        username: 'testadmin',
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);

    accessToken = setupResponse.body.tokens.accessToken;
    refreshToken = setupResponse.body.tokens.refreshToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) redirects to /login when unauthenticated', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(302)
      .expect((response) => {
        expect(response.headers.location).toContain('/login');
      });
  });

  it('/auth/setup returns false after setup', () => {
    return request(app.getHttpServer())
      .get('/auth/setup')
      .expect(200)
      .expect((response) => {
        expect(response.body.required).toBe(false);
      });
  });

  it('/diagnostics requires auth', () => {
    return request(app.getHttpServer())
      .post('/diagnostics')
      .send({ event: 'test' })
      .expect(401);
  });

  it('/diagnostics accepts auth', () => {
    return request(app.getHttpServer())
      .post('/diagnostics')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ event: 'test' })
      .expect(201)
      .expect((response) => {
        expect(response.body.status).toBe('skipped');
      });
  });

  it('/api/v1/auth/login (POST) returns tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'testadmin', password: 'password123' })
      .expect(201);

    expect(response.body.tokens?.accessToken).toBeTruthy();
    expect(response.body.tokens?.refreshToken).toBeTruthy();
    refreshToken = response.body.tokens.refreshToken;
  });

  it('/api/v1/me (GET) returns current user with bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.username).toBe('testadmin');
    expect(response.body.email).toBe('test@example.com');
  });

  it('/api/v1/auth/refresh (POST) refreshes tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(response.body.tokens?.accessToken).toBeTruthy();
    expect(response.body.tokens?.refreshToken).toBeTruthy();
  });

  it('/api/v1/reader/progress roundtrip works', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/reader/progress/ebook/123')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ data: { cfi: 'epubcfi(/6/2[chapter01]!/4/2/2)', page: 5 }, updatedAt: 10 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/reader/progress/ebook/123')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data?.page).toBe(5);
    expect(response.body.updatedAt).toBe(10);
  });

  it('/api/v1/library exists (503 when Bookdarr not configured)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/library')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(503);
  });
});
