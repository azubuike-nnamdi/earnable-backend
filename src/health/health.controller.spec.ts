import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('runs all checks and returns health payload', async () => {
    const redisService = { ping: jest.fn().mockResolvedValue('PONG') };
    const typeOrm = { pingCheck: jest.fn().mockResolvedValue({ postgres: { status: 'up' } }) };
    const http = { pingCheck: jest.fn().mockResolvedValue({ ollama: { status: 'up' } }) };
    const config = { getOrThrow: jest.fn().mockReturnValue('http://localhost:11434'), get: jest.fn().mockReturnValue('ollama') };
    const llmService = { health: jest.fn().mockResolvedValue(undefined) };
    const health = {
      check: jest.fn(async (checks: Array<() => Promise<unknown>>) => {
        const results = await Promise.all(checks.map((check) => check()));
        return { status: 'ok', info: results };
      }),
    };

    const controller = new HealthController(
      health as any,
      typeOrm as any,
      http as any,
      config as any,
      redisService as any,
      llmService as any,
    );
    const result = await controller.check();
    expect((result as any).status).toBe('ok');
    expect(redisService.ping).toHaveBeenCalled();
  });

  it('throws when redis ping is not PONG', async () => {
    const redisService = { ping: jest.fn().mockResolvedValue('NOPE') };
    const typeOrm = { pingCheck: jest.fn().mockResolvedValue({ postgres: { status: 'up' } }) };
    const http = { pingCheck: jest.fn().mockResolvedValue({ ollama: { status: 'up' } }) };
    const config = { getOrThrow: jest.fn().mockReturnValue('http://localhost:11434'), get: jest.fn().mockReturnValue('ollama') };
    const llmService = { health: jest.fn().mockResolvedValue(undefined) };
    const health = {
      check: jest.fn(async (checks: Array<() => Promise<unknown>>) => {
        for (const check of checks) {
          await check();
        }
      }),
    };

    const controller = new HealthController(
      health as any,
      typeOrm as any,
      http as any,
      config as any,
      redisService as any,
      llmService as any,
    );
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
