import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestionService } from '../ingestion/ingestion.service';
import { LlmService } from '../llm/llm.service';
import { AnalysisRecord } from './entities/analysis-record.entity';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly llmService: LlmService,
    @InjectRepository(AnalysisRecord) private readonly analysisRepo: Repository<AnalysisRecord>,
  ) {}

  async run(ingestionId: string, analysisType = 'enterprise-positioning') {
    const ingestion = await this.ingestionService.getById(ingestionId);
    const prompt = this.buildEnterpriseSalesPrompt(ingestion.title, ingestion.canonicalUrl, ingestion.content);

    const llmResult = await this.llmService.complete(
      [{ role: 'user', content: prompt }],
      {
        taskType: 'site-analysis',
        templateVersion: 'v2',
        temperature: 0.2,
        maxTokens: 700,
      },
      undefined,
    );

    const saved = await this.analysisRepo.save(
      this.analysisRepo.create({
        ingestionId,
        analysisType,
        result: llmResult as unknown as Record<string, unknown>,
      }),
    );

    return {
      analysisId: saved.id,
      ingestionId,
      analysisType,
      result: llmResult,
      createdAt: saved.createdAt,
    };
  }

  private buildEnterpriseSalesPrompt(title: string, canonicalUrl: string, content: string): string {
    const boundedContent = content.slice(0, 6000);
    return [
      'You are an enterprise GTM strategist for Earnable.',
      'Objective: convert this crawled web property into a board-ready enterprise sales narrative for corporate buyers.',
      '',
      'About Earnable:',
      '- Earnable helps organizations transform existing content/web properties into monetization-ready, measurable revenue channels.',
      '- It identifies monetization gaps, execution priorities, and conversion-focused growth opportunities.',
      '- Enterprise buyers care about ROI clarity, governance, speed-to-value, scalability, compliance posture, and predictable execution.',
      '',
      'Instructions:',
      '1) Base analysis ONLY on the crawled content.',
      '2) Be explicit about unknowns and assumptions.',
      '3) Use concise, decision-grade language suitable for executives.',
      '4) Prioritize recommendations by impact and implementation effort.',
      '',
      'Return sections in this exact order:',
      'A. Executive Brief (5 bullets max)',
      'B. Enterprise Fit Assessment (ICP, stakeholders, budget owner, urgency signals)',
      'C. Monetization Maturity Score (0-100) + scoring rationale',
      'D. Revenue Risks and Gaps (ranked, with business impact)',
      'E. Enterprise Value Narrative for Earnable (problem -> capability -> measurable outcome)',
      'F. 30/60/90 Day Rollout Plan (with KPIs and dependencies)',
      'G. Objection Handling (security, compliance, integration complexity, ROI skepticism)',
      'H. Proposed Success Metrics and Reporting Cadence',
      '',
      `Page title: ${title}`,
      `Canonical URL: ${canonicalUrl}`,
      '',
      'Crawled source content:',
      '"""',
      boundedContent,
      '"""',
    ].join('\n');
  }
}
