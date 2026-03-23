import { LlmService } from './llm.service';

describe('LlmService', () => {
  it('orchestrates prompt, runner, parse and policy checks', async () => {
    const provider = {
      name: 'ollama',
      complete: jest.fn().mockResolvedValue({ content: 'ok', provider: 'ollama' }),
      health: jest.fn().mockResolvedValue(undefined),
    };
    const openAiProvider = { name: 'openai' };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const logger = { setContext: jest.fn(), info: jest.fn() };
    const promptBuilder = { build: jest.fn().mockReturnValue([{ role: 'system', content: 'x' }]) };
    const structuredOutput = { parse: jest.fn().mockReturnValue({ parsed: { ok: true }, valid: true }) };
    const runner = {
      run: jest.fn().mockResolvedValue({ content: 'ok', provider: 'ollama', latencyMs: 12, valid: true }),
    };
    const inputPolicy = { check: jest.fn() };
    const outputPolicy = { evaluate: jest.fn().mockReturnValue([]) };
    const firecrawl = { scrape: jest.fn() };

    const service = new LlmService(
      provider as any,
      openAiProvider as any,
      config as any,
      logger as any,
      promptBuilder as any,
      structuredOutput as any,
      runner as any,
      inputPolicy as any,
      outputPolicy as any,
      firecrawl as any,
    );
    const response = await service.complete([{ role: 'user', content: 'hi' }]);
    expect(response.content).toBe('ok');
    expect(inputPolicy.check).toHaveBeenCalled();
    expect(promptBuilder.build).toHaveBeenCalled();
    expect(runner.run).toHaveBeenCalled();
    expect(structuredOutput.parse).toHaveBeenCalled();
    expect(outputPolicy.evaluate).toHaveBeenCalled();
    await service.health();
    expect(provider.health).toHaveBeenCalled();
  });
});
