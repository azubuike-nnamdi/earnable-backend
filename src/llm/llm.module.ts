import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LLM_PROVIDER_TOKEN } from './llm.interface';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { PromptSafetyService } from './prompt/prompt-safety.service';
import { PromptTemplateService } from './prompt/prompt-template.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { StructuredOutputService } from './structured-output.service';
import { ResilientLlmRunnerService } from './resilience/resilient-llm-runner.service';
import { InputPolicyService } from './policy/input-policy.service';
import { OutputPolicyService } from './policy/output-policy.service';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [HttpModule, IngestionModule],
  controllers: [LlmController],
  providers: [
    LlmService,
    OllamaProvider,
    OpenAiProvider,
    PromptSafetyService,
    PromptTemplateService,
    PromptBuilderService,
    StructuredOutputService,
    ResilientLlmRunnerService,
    InputPolicyService,
    OutputPolicyService,
    {
      provide: LLM_PROVIDER_TOKEN,
      inject: [ConfigService, OllamaProvider, OpenAiProvider],
      useFactory: (config: ConfigService, ollama: OllamaProvider, openai: OpenAiProvider) => {
        const provider = config.get<string>('LLM_PROVIDER', 'ollama');
        return provider === 'openai' ? openai : ollama;
      },
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
