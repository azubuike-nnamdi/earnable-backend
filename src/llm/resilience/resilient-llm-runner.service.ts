import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { LlmCompleteOptions, LlmCompletion, LlmMessage, LlmProvider } from '../llm.interface';

interface ProviderState {
  failures: number;
  openUntil: number;
}

@Injectable()
export class ResilientLlmRunnerService {
  private readonly circuit = new Map<string, ProviderState>();

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResilientLlmRunnerService.name);
  }

  async run(
    primary: LlmProvider,
    secondary: LlmProvider | null,
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<LlmCompletion> {
    const chain = [primary, secondary].filter((value): value is LlmProvider => Boolean(value));
    let lastError: unknown;

    for (const provider of chain) {
      if (this.isOpen(provider.name)) {
        this.logger.warn({ provider: provider.name }, 'Circuit is open; skipping provider');
        continue;
      }
      try {
        const result = await this.withRetries(provider, messages, options);
        this.recordSuccess(provider.name);
        return result;
      } catch (error) {
        lastError = error;
        this.recordFailure(provider.name);
      }
    }

    const err = lastError instanceof Error ? lastError.message : 'Unknown provider failure';
    throw new ServiceUnavailableException(`All LLM providers unavailable: ${err}`);
  }

  private async withRetries(
    provider: LlmProvider,
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<LlmCompletion> {
    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt += 1;
      const start = Date.now();
      try {
        const timeoutMs = this.config.get<number>('LLM_TIMEOUT_MS', 15000);
        const base = await this.withTimeout(provider.complete(messages, options), timeoutMs);
        const latencyMs = Date.now() - start;
        this.logger.info({ provider: provider.name, attempt, latencyMs }, 'LLM provider attempt succeeded');
        return { ...base, latencyMs, valid: true };
      } catch (error) {
        const latencyMs = Date.now() - start;
        this.logger.warn({ provider: provider.name, attempt, latencyMs }, 'LLM provider attempt failed');
        if (attempt >= maxAttempts) {
          throw error;
        }
        await this.sleep(250 * 2 ** (attempt - 1));
      }
    }
    throw new ServiceUnavailableException('Retries exhausted');
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new ServiceUnavailableException('LLM timeout exceeded')), timeoutMs);
      promise
        .then((result) => resolve(result))
        .catch((error: unknown) =>
          reject(error instanceof Error ? error : new ServiceUnavailableException(String(error))),
        )
        .finally(() => clearTimeout(timer));
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isOpen(provider: string): boolean {
    const state = this.circuit.get(provider);
    return Boolean(state && state.openUntil > Date.now());
  }

  private recordFailure(provider: string): void {
    const state = this.circuit.get(provider) ?? { failures: 0, openUntil: 0 };
    state.failures += 1;
    if (state.failures >= 3) {
      state.openUntil = Date.now() + 30_000;
    }
    this.circuit.set(provider, state);
  }

  private recordSuccess(provider: string): void {
    this.circuit.set(provider, { failures: 0, openUntil: 0 });
  }
}
