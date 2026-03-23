import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('returns current user for me()', () => {
    const result = controller.me({
      user: {
        id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);
    expect(result.id).toBe('u1');
    expect((result as any).password).toBeUndefined();
  });

  it('returns sanitized users list', async () => {
    usersService.findAll.mockResolvedValue([
      {
        id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect((result[0] as any).password).toBeUndefined();
  });

  it('updates current user', async () => {
    usersService.update.mockResolvedValue({
      id: 'u1',
      firstName: 'N',
      lastName: 'B',
      email: 'a@b.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await controller.update({ user: { id: 'u1' } } as any, { firstName: 'N' });
    expect(result.firstName).toBe('N');
  });

  it('throws when update target not found', async () => {
    usersService.update.mockResolvedValue(null);
    await expect(controller.update({ user: { id: 'u1' } } as any, { firstName: 'N' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes current user', async () => {
    usersService.remove.mockResolvedValue(undefined);
    const result = await controller.remove({ user: { id: 'u1' } } as any);
    expect(usersService.remove).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ success: true });
  });
});
