import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PinoLogger } from 'nestjs-pino';
import { LlmCompleteOptions, LlmCompletion, LlmMessage, LlmProvider } from '../llm.interface';

@Injectable()
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai' as const;
  private client?: OpenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenAiProvider.name);
  }

  async complete(messages: LlmMessage[], options?: LlmCompleteOptions): Promise<Omit<LlmCompletion, 'latencyMs' | 'valid'>> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }

    try {
      const response = await this.client.responses.create({
        model: options?.model || 'gpt-4o-mini',
        input: messages.map((message) => ({
          role: message.role,
          content: [{ type: 'input_text', text: message.content }],
        })),
        temperature: options?.temperature,
        max_output_tokens: options?.maxTokens,
      });

      const content = typeof response.output_text === 'string' ? response.output_text : '';
      if (!content.trim()) {
        throw new ServiceUnavailableException('OpenAI returned an empty response');
      }

      return {
        content,
        provider: 'openai',
        usage: {
          promptTokens: response.usage?.input_tokens,
          completionTokens: response.usage?.output_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error({ err }, 'OpenAI completion failed');
      throw new ServiceUnavailableException('OpenAI provider unavailable');
    }
  }

  async health(): Promise<void> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }
    await Promise.resolve();
  }
}
