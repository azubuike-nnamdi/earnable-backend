import { Injectable } from '@nestjs/common';
import { LlmCompleteOptions } from './llm.interface';

@Injectable()
export class StructuredOutputService {
  parse(content: string, options?: LlmCompleteOptions): { parsed?: Record<string, unknown>; valid: boolean } {
    if (!options?.responseSchema) {
      return { valid: true };
    }

    const attempts = [content, this.tryFixJson(content)];
    for (const attempt of attempts) {
      if (!attempt) {
        continue;
      }
      try {
        const parsed = JSON.parse(attempt) as Record<string, unknown>;
        if (this.validateAgainstSchema(parsed, options.responseSchema)) {
          return { parsed, valid: true };
        }
      } catch {
        // continue to next attempt
      }
    }

    return { valid: false };
  }

  private tryFixJson(content: string): string | null {
    const normalized = content.trim();
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    return normalized.slice(start, end + 1);
  }

  private validateAgainstSchema(parsed: Record<string, unknown>, schema: NonNullable<LlmCompleteOptions['responseSchema']>): boolean {
    if (schema.type !== 'object' || typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return false;
    }
    const required = schema.required ?? [];
    return required.every((field) => Object.prototype.hasOwnProperty.call(parsed, field));
  }
}
