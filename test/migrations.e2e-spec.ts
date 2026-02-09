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

// Fresh-install hardening: DB_SYNC must not be required.
// This boots against an empty DB and relies on TypeORM migrations to create schema.

describe('DB migrations (fresh install)', () => {
  let app: INestApplication;
  let httpServer: any;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = join(tmpdir(), `bms-migrations-e2e-${randomUUID()}.sqlite`);
    process.env.PORT = '9797';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = dbPath;
    process.env.DB_SYNC = 'false';
    process.env.DB_MIGRATIONS = 'true';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    // Bookdarr is not needed for setup; keep it unset to avoid any accidental fetch.
    delete process.env.BOOKDARR_API_URL;
    delete process.env.BOOKDARR_API_KEY;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    const requestId = new RequestIdMiddleware();
    app.use(requestId.use.bind(requestId));
    app.useGlobalFilters(new HttpExceptionFilter(app.get(FileLoggerService)));
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dbPath && existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
  });

  it('can setup first user with DB_SYNC=false and DB_MIGRATIONS=true', async () => {
    const response = await request(httpServer)
      .post('/auth/setup')
      .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body?.user?.username).toBe('admin');
    expect(typeof response.body?.tokens?.accessToken).toBe('string');
    expect(typeof response.body?.tokens?.refreshToken).toBe('string');
  });
});

