import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FirecrawlService } from '../ingestion/firecrawl.service';
import {
  LLM_PROVIDER_TOKEN,
  LlmCompleteOptions,
  LlmCompletion,
  LlmMessage,
  LlmProvider,
  LlmProviderName,
} from './llm.interface';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { StructuredOutputService } from './structured-output.service';
import { ResilientLlmRunnerService } from './resilience/resilient-llm-runner.service';
import { InputPolicyService } from './policy/input-policy.service';
import { OutputPolicyService } from './policy/output-policy.service';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class LlmService {
  constructor(
    @Inject(LLM_PROVIDER_TOKEN) private readonly provider: LlmProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
    private readonly promptBuilder: PromptBuilderService,
    private readonly structuredOutput: StructuredOutputService,
    private readonly runner: ResilientLlmRunnerService,
    private readonly inputPolicy: InputPolicyService,
    private readonly outputPolicy: OutputPolicyService,
    private readonly firecrawl: FirecrawlService,
  ) {
    this.logger.setContext(LlmService.name);
  }

  async complete(
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
    sourceUrl?: string,
  ): Promise<LlmCompletion> {
    const orchestratedMessages = await this.buildMessages(messages, sourceUrl);
    this.inputPolicy.check(orchestratedMessages.map((m) => m.content));
    const taskAwareOptions: LlmCompleteOptions = sourceUrl
      ? { ...options, taskType: options?.taskType ?? 'site-analysis' }
      : (options ?? {});
    const prompt = this.promptBuilder.build(orchestratedMessages, taskAwareOptions);
    const secondary = this.resolveSecondaryProvider(this.provider.name);
    const completion = await this.runner.run(this.provider, secondary, prompt, taskAwareOptions);
    const parseResult = this.structuredOutput.parse(completion.content, taskAwareOptions);
    const policyFlags = this.outputPolicy.evaluate(completion.content);
    const valid = completion.valid && parseResult.valid;

    this.logger.info(
      {
        provider: completion.provider,
        latencyMs: completion.latencyMs,
        valid,
        policyFlags,
      },
      'LLM completion finalized',
    );

    return {
      ...completion,
      parsed: parseResult.parsed,
      valid,
      warnings: parseResult.valid ? completion.warnings : [...(completion.warnings ?? []), 'schema-validation-failed'],
      policyFlags,
    };
  }

  health(): Promise<void> {
    return this.provider.health();
  }

  private resolveSecondaryProvider(primary: LlmProviderName): LlmProvider | null {
    const hasOpenAi = Boolean(this.config.get<string>('OPENAI_API_KEY'));
    if (primary === 'openai' || !hasOpenAi) {
      return null;
    }
    return this.openAiProvider;
  }

  private async buildMessages(messages: LlmMessage[], sourceUrl?: string): Promise<LlmMessage[]> {
    if (!sourceUrl) {
      if (!messages.length) {
        throw new BadRequestException('messages is required when sourceUrl is not provided');
      }
      return messages;
    }
    if (!/^https?:\/\//.test(sourceUrl)) {
      throw new BadRequestException('Invalid sourceUrl');
    }
    const scraped = await this.firecrawl.scrape(sourceUrl);
    return [
      {
        role: 'user',
        content: this.buildUrlIngestionPrompt(scraped.title, scraped.canonicalUrl, scraped.content),
      },
    ];
  }

  private buildUrlIngestionPrompt(title: string, canonicalUrl: string, content: string): string {
    return [
      'You are analyzing a crawled webpage for monetization readiness.',
      'Use ONLY the crawled source content provided below; do not invent missing facts.',
      'Return a practical, execution-oriented assessment.',
      '',
      'Required sections:',
      '1) Executive summary (2-4 bullet points)',
      '2) Audience and intent signals',
      '3) Monetization readiness score (0-100) with rationale',
      '4) Revenue gaps (prioritized)',
      '5) High-impact recommendations (next 7 days)',
      '6) Content opportunities (top 5)',
      '',
      `Page title: ${title}`,
      `Canonical URL: ${canonicalUrl}`,
      '',
      'Crawled content starts:',
      '"""',
      content,
      '"""',
      '',
      'Crawled content ends.',
    ].join('\n');
  }
}
