import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy', () => {
  const config = { getOrThrow: jest.fn().mockReturnValue('secret') } as any;
  const usersService = { findOne: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns payload + user when hash exists', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1', refreshTokenHash: 'hash' });
    const strategy = new JwtRefreshStrategy(config, usersService);
    const result = await strategy.validate({} as any, { sub: 'u1', email: 'a@b.com' });
    expect((result as any).user.id).toBe('u1');
  });

  it('throws when user/hash missing', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1', refreshTokenHash: null });
    const strategy = new JwtRefreshStrategy(config, usersService);
    await expect(strategy.validate({} as any, { sub: 'u1', email: 'a@b.com' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
