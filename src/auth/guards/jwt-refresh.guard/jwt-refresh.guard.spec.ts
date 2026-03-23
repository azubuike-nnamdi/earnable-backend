import { JwtRefreshGuard } from './jwt-refresh.guard';

describe('JwtRefreshGuard', () => {
  it('is defined', () => {
    expect(new JwtRefreshGuard()).toBeDefined();
  });
});
