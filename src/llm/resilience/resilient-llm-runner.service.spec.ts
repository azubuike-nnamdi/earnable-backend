import { ServiceUnavailableException } from '@nestjs/common';
import { ResilientLlmRunnerService } from './resilient-llm-runner.service';

describe('ResilientLlmRunnerService', () => {
  const config = { get: jest.fn().mockReturnValue(50) };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };

  it('uses primary provider when healthy', async () => {
    const runner = new ResilientLlmRunnerService(config as any, logger as any);
    const primary = {
      name: 'ollama',
      complete: jest.fn().mockResolvedValue({ content: 'ok', provider: 'ollama' }),
    };

    const result = await runner.run(primary as any, null, [{ role: 'user', content: 'hi' }]);
    expect(result.provider).toBe('ollama');
    expect(primary.complete).toHaveBeenCalled();
  });

  it('falls back when primary fails', async () => {
    const runner = new ResilientLlmRunnerService(config as any, logger as any);
    const primary = { name: 'ollama', complete: jest.fn().mockRejectedValue(new Error('down')) };
    const secondary = {
      name: 'openai',
      complete: jest.fn().mockResolvedValue({ content: 'ok2', provider: 'openai' }),
    };

    const result = await runner.run(primary as any, secondary as any, [{ role: 'user', content: 'hi' }]);
    expect(result.provider).toBe('openai');
  });

  it('throws when all providers fail', async () => {
    const runner = new ResilientLlmRunnerService(config as any, logger as any);
    const failing = { name: 'ollama', complete: jest.fn().mockRejectedValue(new Error('down')) };
    await expect(runner.run(failing as any, null, [{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
