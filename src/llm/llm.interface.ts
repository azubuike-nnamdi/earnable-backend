export type LlmMessageRole = 'system' | 'user' | 'assistant';
export type LlmProviderName = 'ollama' | 'openai';
export type LlmTaskType = 'general' | 'site-analysis' | 'json-fix';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}

export interface LlmResponseSchema {
  type: 'object';
  required?: string[];
  properties: Record<string, unknown>;
}

export interface LlmCompleteOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  taskType?: LlmTaskType;
  templateVersion?: 'v1' | 'v2';
  responseSchema?: LlmResponseSchema;
  metadata?: Record<string, unknown>;
}

export interface LlmCompletion {
  content: string;
  parsed?: Record<string, unknown>;
  valid: boolean;
  provider: LlmProviderName;
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  warnings?: string[];
  policyFlags?: string[];
}

export interface LlmProvider {
  readonly name: LlmProviderName;
  complete(messages: LlmMessage[], options?: LlmCompleteOptions): Promise<Omit<LlmCompletion, 'latencyMs' | 'valid'>>;
  health(): Promise<void>;
}

export const LLM_PROVIDER_TOKEN = Symbol('LLM_PROVIDER_TOKEN');
