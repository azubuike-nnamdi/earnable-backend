import { Injectable } from '@nestjs/common';
import { LlmTaskType } from '../llm.interface';

@Injectable()
export class PromptTemplateService {
  private readonly templates: Record<string, string> = {
    'general:v1': 'You are a precise assistant. Answer clearly and safely.',
    'general:v2': 'You are a production assistant. Be concise, factual, and return valid JSON when asked.',
    'site-analysis:v1': 'Analyze the provided webpage content and summarize key insights with evidence.',
    'site-analysis:v2': 'Analyze web content rigorously. Call out uncertainty and avoid unsupported claims.',
    'json-fix:v1': 'Return strictly valid JSON only. No prose.',
    'json-fix:v2': 'Repair malformed JSON and return JSON only.',
  };

  resolve(taskType: LlmTaskType = 'general', version: 'v1' | 'v2' = 'v1'): string {
    return this.templates[`${taskType}:${version}`] ?? this.templates['general:v1'];
  }
}
