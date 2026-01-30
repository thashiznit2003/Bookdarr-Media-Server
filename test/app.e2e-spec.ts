import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

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
    await app.init();

    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        inviteCode: 'TESTINVITE',
      })
      .expect(201);

    accessToken = signupResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect((response) => {
        expect(response.text).toContain('Bookdarr Media Server');
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
});
