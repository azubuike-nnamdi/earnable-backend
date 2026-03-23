import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

const BLOCKED_PATTERNS: RegExp[] = [
  /ignore\s+previous\s+instructions/i,
  /system\s+override/i,
  /disregard\s+all\s+rules/i,
  /reveal\s+system\s+prompt/i,
];

@Injectable()
export class PromptSafetyService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(PromptSafetyService.name);
  }

  assertSafe(text: string): void {
    const matched = BLOCKED_PATTERNS.find((pattern) => pattern.test(text));
    if (!matched) {
      return;
    }

    this.logger.warn({ pattern: matched.source }, 'Prompt rejected by safety rule');
    throw new BadRequestException('Prompt contains disallowed injection pattern');
  }
}
