import { of, throwError } from 'rxjs';
import { ServiceUnavailableException } from '@nestjs/common';
import { OllamaProvider } from './ollama.provider';

describe('OllamaProvider', () => {
  const config = {
    getOrThrow: jest.fn((key: string) =>
      ({ OLLAMA_BASE_URL: 'http://localhost:11434', OLLAMA_MODEL: 'llama3.2' } as Record<string, string>)[key],
    ),
  };
  const http = {
    post: jest.fn(),
    get: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns completion content', async () => {
    http.post.mockReturnValue(of({ data: { message: { content: 'hello' } } }));
    const provider = new OllamaProvider(config as any, http as any, logger as any);
    const result = await provider.complete([{ role: 'user', content: 'hi' }]);
    expect(result).toEqual({ content: 'hello', provider: 'ollama' });
  });

  it('throws when ollama response is empty', async () => {
    http.post.mockReturnValue(of({ data: { message: {} } }));
    const provider = new OllamaProvider(config as any, http as any, logger as any);
    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws when http call fails', async () => {
    http.post.mockReturnValue(throwError(() => new Error('network')));
    const provider = new OllamaProvider(config as any, http as any, logger as any);
    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('pings health endpoint', async () => {
    http.get.mockReturnValue(of({ data: { models: [] } }));
    const provider = new OllamaProvider(config as any, http as any, logger as any);
    await provider.health();
    expect(http.get).toHaveBeenCalledWith('http://localhost:11434/api/tags', { timeout: 5000 });
  });
});
