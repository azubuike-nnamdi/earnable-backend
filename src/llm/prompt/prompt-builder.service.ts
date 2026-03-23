import { Injectable } from '@nestjs/common';
import { LlmCompleteOptions, LlmMessage } from '../llm.interface';
import { PromptSafetyService } from './prompt-safety.service';
import { PromptTemplateService } from './prompt-template.service';

@Injectable()
export class PromptBuilderService {
  constructor(
    private readonly promptSafety: PromptSafetyService,
    private readonly promptTemplate: PromptTemplateService,
  ) {}

  build(messages: LlmMessage[], options?: LlmCompleteOptions): LlmMessage[] {
    const systemPrompt = this.promptTemplate.resolve(options?.taskType, options?.templateVersion);
    const safeMessages = messages.map((message) => {
      this.promptSafety.assertSafe(message.content);
      return message;
    });

    return [{ role: 'system', content: systemPrompt }, ...safeMessages];
  }
}
