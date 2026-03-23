import { PromptBuilderService } from './prompt-builder.service';

describe('PromptBuilderService', () => {
  it('prepends system template and safety checks messages', () => {
    const promptSafety = { assertSafe: jest.fn() };
    const promptTemplate = { resolve: jest.fn().mockReturnValue('system-template') };
    const service = new PromptBuilderService(promptSafety as any, promptTemplate as any);

    const result = service.build([{ role: 'user', content: 'hi' }], {
      taskType: 'general',
      templateVersion: 'v1',
    });

    expect(result[0]).toEqual({ role: 'system', content: 'system-template' });
    expect(promptSafety.assertSafe).toHaveBeenCalledWith('hi');
  });
});
