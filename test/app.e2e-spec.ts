import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { LlmService } from '../src/llm/llm.service';
import { HttpHealthIndicator } from '@nestjs/terminus';

describe('Earnable backend e2e', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;
  const email = `e2e+${Date.now()}@example.com`;
  const password = 'TestPass123!';

  interface AuthResponseBody {
    user: { email: string; password?: string };
    accessToken: string;
    refreshToken: string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LlmService)
      .useValue({
        complete: jest.fn().mockResolvedValue({ content: 'ok', provider: 'ollama', latencyMs: 5, valid: true }),
        health: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(HttpHealthIndicator)
      .useValue({
        pingCheck: jest.fn().mockResolvedValue({ 'ollama-http': { status: 'up' } }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should be public and return status', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const body = res.body as { status?: string };
    expect(body.status).toBeDefined();
  });

  it('GET /users/me should require auth', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('POST /auth/signup should issue tokens and sanitized user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .set('x-correlation-id', randomUUID())
      .send({
        firstName: 'E2E',
        lastName: 'Tester',
        email,
        password,
      })
      .expect(201);

    const body = res.body as AuthResponseBody;
    expect(body.user.email).toBe(email);
    expect(body.user.password).toBeUndefined();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();

    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  it('POST /auth/refresh should rotate refresh token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    const body = res.body as AuthResponseBody;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();

    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  it('GET /users/me should return authenticated user (sanitized)', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { email?: string; password?: string; refreshTokenHash?: string };
    expect(body.email).toBe(email);
    expect(body.password).toBeUndefined();
    expect(body.refreshTokenHash).toBeUndefined();
  });

  it('POST /llm/smoke should work with auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/llm/smoke')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const body = res.body as { content?: string; provider?: string };
    expect(body.content).toBeDefined();
    expect(body.provider).toBeDefined();
  });

  it('POST /auth/logout should revoke refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }).expect(401);
  });
});
