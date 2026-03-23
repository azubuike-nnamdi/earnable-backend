import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { LlmCompleteDto } from './dto/llm-complete.dto';

@ApiTags('llm')
@ApiBearerAuth()
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('complete')
  @ApiOperation({ summary: 'Run a chat completion through configured LLM provider' })
  complete(@Body() dto: LlmCompleteDto) {
    return this.llmService.complete(
      dto.messages ?? [],
      {
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        taskType: dto.taskType,
        templateVersion: dto.templateVersion,
        responseSchema: dto.responseSchema,
      },
      dto.sourceUrl,
    );
  }

  @Post('smoke')
  @ApiOperation({ summary: 'Smoke test LLM provider with a simple prompt' })
  smoke() {
    return this.llmService.complete([{ role: 'user', content: 'Reply with OK' }]);
  }
}
