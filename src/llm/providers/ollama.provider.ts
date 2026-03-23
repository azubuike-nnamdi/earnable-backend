import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import type { AxiosResponse } from 'axios';
import { LlmCompleteOptions, LlmCompletion, LlmMessage, LlmProvider } from '../llm.interface';

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

@Injectable()
export class OllamaProvider implements LlmProvider {
  readonly name = 'ollama' as const;
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OllamaProvider.name);
  }

  async complete(messages: LlmMessage[], options?: LlmCompleteOptions): Promise<Omit<LlmCompletion, 'latencyMs' | 'valid'>> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const model = options?.model || this.config.getOrThrow<string>('OLLAMA_MODEL');
    const timeoutMs = this.config.get<number>('LLM_TIMEOUT_MS', 15000);

    this.logger.info({ provider: 'ollama', model }, 'LLM completion started');
    try {
      const response = await firstValueFrom<AxiosResponse<OllamaChatResponse>>(
        this.http.post(
          `${baseUrl}/api/chat`,
          {
            model,
            messages,
            stream: false,
            options: {
              temperature: options?.temperature,
              num_predict: options?.maxTokens,
            },
          },
          {
            timeout: timeoutMs,
          },
        ),
      );

      const content = response.data.message?.content;
      if (!content) {
        throw new ServiceUnavailableException('Ollama returned an empty response');
      }

      this.logger.info({ provider: 'ollama', model }, 'LLM completion finished');
      return { content, provider: 'ollama' };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error({ err }, 'Ollama completion failed');
      throw new ServiceUnavailableException('Ollama provider unavailable');
    }
  }

  async health(): Promise<void> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    await firstValueFrom(
      this.http.get(`${baseUrl}/api/tags`, {
        timeout: 5000,
      }),
    );
  }
}
