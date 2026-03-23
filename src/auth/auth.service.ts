import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { toUserResponseDto } from '../users/mappers/user.mapper';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/sign-in.dto';
import type { AuthTokensResponse } from './types';

/**
 * Handles sign-up, sign-in, refresh token rotation, logout, and revoke.
 * Refresh tokens are stored as bcrypt hashes for validation on rotation.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async signup(dto: SignUpDto): Promise<AuthTokensResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      this.logger.warn({ email: dto.email }, 'Signup attempted with existing email');
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
    });

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshTokenHash);

    this.logger.info({ userId: user.id, email: user.email }, 'User signed up');
    return {
      user: toUserResponseDto(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async signin(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn({ email: dto.email }, 'Signin failed: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      this.logger.warn({ userId: user.id }, 'Signin failed: invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshTokenHash);

    this.logger.info({ userId: user.id, email: user.email }, 'User signed in');
    return {
      user: toUserResponseDto(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokensResponse> {
    const user = await this.usersService.findOne(userId);
    if (!user?.refreshTokenHash) {
      this.logger.warn({ userId }, 'Refresh failed: user or token hash missing');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hashMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!hashMatch) {
      this.logger.warn({ userId: user.id }, 'Refresh failed: token hash mismatch');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.usersService.setRefreshTokenHash(user.id, tokens.refreshTokenHash);

    this.logger.info({ userId: user.id }, 'Tokens refreshed');
    return {
      user: toUserResponseDto(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshTokenHash(userId);
    this.logger.info({ userId }, 'User logged out');
  }

  async revoke(userId: string): Promise<void> {
    await this.usersService.clearRefreshTokenHash(userId);
    this.logger.info({ userId }, 'Refresh token revoked');
  }

  private async issueTokenPair(
    sub: string,
    email: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenHash: string;
    expiresIn: number;
  }> {
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpires = this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES');
    const refreshExpires = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES');

    const accessExpiresIn = accessExpires as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = refreshExpires as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub, email },
        { secret: accessSecret, expiresIn: accessExpiresIn },
      ),
      this.jwtService.signAsync(
        { sub, email },
        { secret: refreshSecret, expiresIn: refreshExpiresIn },
      ),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresIn = this.parseExpiresToSeconds(accessExpires);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
      expiresIn,
    };
  }

  private parseExpiresToSeconds(expires: string): number {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 60);
  }
}
