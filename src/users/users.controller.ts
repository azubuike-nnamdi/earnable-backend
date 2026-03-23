import { Body, Controller, Delete, Get, NotFoundException, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { toUserResponseDto } from './mappers/user.mapper';
import { UsersService } from './users.service';

interface RequestWithUser extends Request {
  user?: User;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @Get('me')
  me(@Req() req: RequestWithUser) {
    const currentUser = req.user as User;
    return toUserResponseDto(currentUser);
  }

  @ApiOperation({ summary: 'List users (sanitized fields)' })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(toUserResponseDto);
  }

  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @Patch('me')
  async update(@Req() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    const currentUser = req.user as User;
    const updated = await this.usersService.update(currentUser.id, updateUserDto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return toUserResponseDto(updated);
  }

  @ApiOperation({ summary: 'Delete current authenticated user account' })
  @Delete('me')
  async remove(@Req() req: RequestWithUser) {
    const currentUser = req.user as User;
    await this.usersService.remove(currentUser.id);
    return { success: true };
  }
}
