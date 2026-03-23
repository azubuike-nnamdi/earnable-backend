import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates user', async () => {
    repository.create.mockReturnValue({ email: 'a@b.com' });
    repository.save.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    const result = await service.create({} as any);
    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.id).toBe('u1');
  });

  it('finds all users', async () => {
    repository.find.mockResolvedValue([{ id: 'u1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('finds by email', async () => {
    repository.findOne.mockResolvedValue({ id: 'u1' });
    await service.findByEmail('a@b.com');
    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('finds one by id', async () => {
    repository.findOne.mockResolvedValue({ id: 'u1' });
    await service.findOne('u1');
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('updates and returns refreshed user', async () => {
    repository.update.mockResolvedValue(undefined);
    repository.findOne.mockResolvedValue({ id: 'u1', firstName: 'N' });
    const result = await service.update('u1', { firstName: 'N' });
    expect(repository.update).toHaveBeenCalledWith('u1', { firstName: 'N' });
    expect(result?.firstName).toBe('N');
  });

  it('removes user', async () => {
    repository.delete.mockResolvedValue(undefined);
    await service.remove('u1');
    expect(repository.delete).toHaveBeenCalledWith('u1');
  });

  it('sets and clears refresh token hash', async () => {
    repository.update.mockResolvedValue(undefined);
    await service.setRefreshTokenHash('u1', 'hash');
    await service.clearRefreshTokenHash('u1');
    expect(repository.update).toHaveBeenNthCalledWith(1, 'u1', { refreshTokenHash: 'hash' });
    expect(repository.update).toHaveBeenNthCalledWith(2, 'u1', { refreshTokenHash: null });
  });
});
