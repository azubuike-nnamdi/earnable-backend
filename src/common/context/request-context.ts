import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextValue {
  requestId: string;
  correlationId: string;
}

const storage = new AsyncLocalStorage<RequestContextValue>();

export class RequestContext {
  static run(context: RequestContextValue, callback: () => void): void {
    storage.run(context, callback);
  }

  static get(): RequestContextValue | undefined {
    return storage.getStore();
  }
}
