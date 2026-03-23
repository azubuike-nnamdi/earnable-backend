import { LlmController } from './llm.controller';

describe('LlmController', () => {
  const llmService = {
    complete: jest.fn().mockResolvedValue({ content: 'ok', provider: 'ollama', latencyMs: 10, valid: true }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes completion payload to service', async () => {
    const controller = new LlmController(llmService as any);
    const dto = {
      messages: [{ role: 'user', content: 'hello' }],
      model: 'llama',
      temperature: 0.1,
      maxTokens: 10,
      taskType: 'general',
      templateVersion: 'v1',
      responseSchema: { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } },
      sourceUrl: 'https://example.com',
    };
    await controller.complete(dto as any);
    expect(llmService.complete).toHaveBeenCalledWith(dto.messages, {
      model: 'llama',
      temperature: 0.1,
      maxTokens: 10,
      taskType: 'general',
      templateVersion: 'v1',
      responseSchema: dto.responseSchema,
    }, 'https://example.com');
  });

  it('runs smoke test prompt', async () => {
    const controller = new LlmController(llmService as any);
    await controller.smoke();
    expect(llmService.complete).toHaveBeenCalledWith([{ role: 'user', content: 'Reply with OK' }]);
  });
});
