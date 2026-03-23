import { ServiceUnavailableException } from '@nestjs/common';
import { OpenAiProvider } from './openai.provider';

describe('OpenAiProvider', () => {
  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when api key is missing', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const provider = new OpenAiProvider(config as any, logger as any);
    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns content when openai succeeds', async () => {
    const config = { get: jest.fn().mockReturnValue('key') };
    const provider = new OpenAiProvider(config as any, logger as any);
    (provider as any).client = {
      responses: {
        create: jest.fn().mockResolvedValue({
          output_text: 'answer',
          usage: { input_tokens: 2, output_tokens: 3, total_tokens: 5 },
        }),
      },
    };
    const result = await provider.complete([{ role: 'user', content: 'hi' }], { model: 'x' });
    expect(result).toEqual({
      content: 'answer',
      provider: 'openai',
      usage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
    });
  });

  it('throws when openai returns empty content', async () => {
    const config = { get: jest.fn().mockReturnValue('key') };
    const provider = new OpenAiProvider(config as any, logger as any);
    (provider as any).client = {
      responses: {
        create: jest.fn().mockResolvedValue({ output_text: '' }),
      },
    };
    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws when openai sdk fails', async () => {
    const config = { get: jest.fn().mockReturnValue('key') };
    const provider = new OpenAiProvider(config as any, logger as any);
    (provider as any).client = {
      responses: {
        create: jest.fn().mockRejectedValue(new Error('boom')),
      },
    };
    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('health checks api key requirement', async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const provider = new OpenAiProvider(config as any, logger as any);
    await expect(provider.health()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
