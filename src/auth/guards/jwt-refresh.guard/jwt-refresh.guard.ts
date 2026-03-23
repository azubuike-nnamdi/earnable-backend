import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects refresh-token route; validates JWT refresh token from body or cookie.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
