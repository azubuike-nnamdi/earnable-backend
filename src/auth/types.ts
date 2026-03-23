import type { UserResponseDto } from '../users/dto/user-response.dto';

export interface AuthTokensResponse {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
