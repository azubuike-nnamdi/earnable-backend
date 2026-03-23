import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { getOrThrow: jest.fn().mockReturnValue('secret') } as any;
  const usersService = { findOne: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user when found', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1' });
    const strategy = new JwtStrategy(config, usersService);
    await expect(strategy.validate({ sub: 'u1', email: 'a@b.com' })).resolves.toEqual({ id: 'u1' });
  });

  it('throws when user not found', async () => {
    usersService.findOne.mockResolvedValue(null);
    const strategy = new JwtStrategy(config, usersService);
    await expect(strategy.validate({ sub: 'u1', email: 'a@b.com' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
