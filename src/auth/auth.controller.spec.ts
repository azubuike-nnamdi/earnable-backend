import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    signup: jest.fn(),
    signin: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates signup', async () => {
    authService.signup.mockResolvedValue({ ok: true });
    const dto = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'password123' };
    await controller.signup(dto);
    expect(authService.signup).toHaveBeenCalledWith(dto);
  });

  it('delegates signin', async () => {
    authService.signin.mockResolvedValue({ ok: true });
    const dto = { email: 'a@b.com', password: 'password123' };
    await controller.signin(dto);
    expect(authService.signin).toHaveBeenCalledWith(dto);
  });

  it('delegates refresh', async () => {
    authService.refresh.mockResolvedValue({ ok: true });
    await controller.refresh({ refreshToken: 'rt' }, { user: { user: { id: 'u1' } } } as any);
    expect(authService.refresh).toHaveBeenCalledWith('u1', 'rt');
  });

  it('delegates logout', async () => {
    authService.logout.mockResolvedValue(undefined);
    await controller.logout({ user: { id: 'u1' } } as any);
    expect(authService.logout).toHaveBeenCalledWith('u1');
  });

  it('delegates revoke', async () => {
    authService.revoke.mockResolvedValue(undefined);
    await controller.revoke({ user: { id: 'u1' } } as any);
    expect(authService.revoke).toHaveBeenCalledWith('u1');
  });
});
