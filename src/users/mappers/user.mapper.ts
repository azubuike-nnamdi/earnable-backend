import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
