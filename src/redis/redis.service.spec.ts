import { RedisService } from './redis.service';

describe('RedisService', () => {
  it('pings redis and connects lazily', async () => {
    const service = Object.create(RedisService.prototype) as RedisService;
    (service as any).client = {
      status: 'wait',
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined),
    };
    const pong = await service.ping();
    expect(pong).toBe('PONG');
    expect((service as any).client.connect).toHaveBeenCalled();
  });

  it('skips quit when client already ended', async () => {
    const service = Object.create(RedisService.prototype) as RedisService;
    (service as any).client = {
      status: 'end',
      quit: jest.fn(),
    };
    await service.onModuleDestroy();
    expect((service as any).client.quit).not.toHaveBeenCalled();
  });

  it('quits open redis client on destroy', async () => {
    const service = Object.create(RedisService.prototype) as RedisService;
    (service as any).client = {
      status: 'ready',
      quit: jest.fn().mockResolvedValue(undefined),
    };
    await service.onModuleDestroy();
    expect((service as any).client.quit).toHaveBeenCalled();
  });
});
