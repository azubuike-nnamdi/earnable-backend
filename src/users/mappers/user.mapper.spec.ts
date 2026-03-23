import { toUserResponseDto } from './user.mapper';

describe('toUserResponseDto', () => {
  it('maps only public user fields', () => {
    const user = {
      id: 'u1',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      password: 'secret',
      refreshTokenHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    const dto = toUserResponseDto(user);
    expect(dto.id).toBe('u1');
    expect((dto as any).password).toBeUndefined();
    expect((dto as any).refreshTokenHash).toBeUndefined();
  });
});
