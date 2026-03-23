import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensResponseDto {
  @ApiProperty({ description: 'Current user (no sensitive fields)' })
  user: UserResponseDto;

  @ApiProperty({ description: 'Short-lived access token for Authorization header' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived refresh token; use POST /auth/refresh to get new access token' })
  refreshToken: string;

  @ApiProperty({ description: 'Seconds until access token expires' })
  expiresIn: number;
}
