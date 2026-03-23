import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('stores and retrieves context within run', () => {
    RequestContext.run({ requestId: 'r1', correlationId: 'c1' }, () => {
      expect(RequestContext.get()).toEqual({ requestId: 'r1', correlationId: 'c1' });
    });
  });

  it('returns undefined outside context', () => {
    expect(RequestContext.get()).toBeUndefined();
  });
});
