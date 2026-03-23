import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard/jwt-refresh.guard';
import { Public } from '../common';
import type { Request } from 'express';
import type { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user?: User | { user: User };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  signin(@Body() dto: LoginDto) {
    return this.authService.signin(dto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Exchange refresh token for new access and refresh tokens' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: RequestWithUser) {
    const payload = req.user as { user: User };
    return this.authService.refresh(payload.user.id, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and invalidate refresh token' })
  logout(@Req() req: RequestWithUser) {
    const user = req.user as User;
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke refresh token for the authenticated user' })
  revoke(@Req() req: RequestWithUser) {
    const user = req.user as User;
    return this.authService.revoke(user.id);
  }
}
