import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/sign-in.dto';

/**
 * AuthService is responsible for user sign-up and sign-in flows.
 * It delegates user persistence to UsersService and issues JWT access tokens
 * that are later validated by the configured JWT strategy and guards.
 */

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and returns the created user plus a signed access token.
   * Throws UnauthorizedException if a user with the same email already exists.
   */
  async signup({ firstName, lastName, email, password }: SignUpDto) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { user, accessToken };
  }

  /**
   * Validates user credentials and returns the user plus a signed access token.
   * Throws UnauthorizedException when credentials are invalid.
   */
  async signin({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { user, accessToken };
  }
}
