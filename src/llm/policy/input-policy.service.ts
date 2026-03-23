import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class InputPolicyService {
  check(messages: string[]): void {
    if (messages.length === 0) {
      throw new BadRequestException('At least one message is required');
    }

    const totalLength = messages.reduce((sum, value) => sum + value.length, 0);
    if (totalLength > 20000) {
      throw new BadRequestException('Prompt payload exceeds policy limits');
    }
  }
}
