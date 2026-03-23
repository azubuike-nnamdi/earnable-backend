import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    setRefreshTokenHash: jest.fn(),
    findOne: jest.fn(),
    clearRefreshTokenHash: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access',
        JWT_REFRESH_SECRET: 'refresh',
        JWT_ACCESS_EXPIRES: '15m',
        JWT_REFRESH_EXPIRES: '7d',
      };
      return map[key];
    }),
  };

  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('signs up a new user and stores refresh hash', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    (bcrypt.hash as jest.Mock)
      .mockResolvedValueOnce('hashed-password')
      .mockResolvedValueOnce('hashed-refresh');

    const result = await service.signup({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      password: 'password123',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-password' }),
    );
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('u1', 'hashed-refresh');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('a@b.com');
  });

  it('throws on duplicate signup', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing' });
    await expect(
      service.signup({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('signs in with valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed-password',
      firstName: 'A',
      lastName: 'B',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');

    const result = await service.signin({ email: 'a@b.com', password: 'password123' });
    expect(result.accessToken).toBe('access-token');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('u1', 'hashed-refresh');
  });

  it('throws on signin when user missing', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.signin({ email: 'x@y.com', password: 'password123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws on signin when password mismatch', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed-password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.signin({ email: 'a@b.com', password: 'password123' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refreshes tokens when hash matches', async () => {
    usersService.findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      refreshTokenHash: 'hashed',
      firstName: 'A',
      lastName: 'B',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-refresh-hash');

    const result = await service.refresh('u1', 'refresh-token');
    expect(result.accessToken).toBe('new-access');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('u1', 'new-refresh-hash');
  });

  it('throws when refresh hash is absent', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', refreshTokenHash: null });
    await expect(service.refresh('u1', 'token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when refresh token does not match hash', async () => {
    usersService.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', refreshTokenHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.refresh('u1', 'token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('clears token hash on logout/revoke', async () => {
    await service.logout('u1');
    await service.revoke('u1');
    expect(usersService.clearRefreshTokenHash).toHaveBeenCalledTimes(2);
  });
});
