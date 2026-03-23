import { Injectable } from '@nestjs/common';

@Injectable()
export class OutputPolicyService {
  evaluate(content: string): string[] {
    const flags: string[] = [];
    if (/api[_-]?key|secret|password/i.test(content)) {
      flags.push('possible-sensitive-content');
    }
    if (content.length > 30000) {
      flags.push('oversized-output');
    }
    return flags;
  }
}
