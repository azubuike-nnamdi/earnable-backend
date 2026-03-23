import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';

export interface IngestedContent {
  title: string;
  canonicalUrl: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    title?: string;
    metadata?: Record<string, unknown>;
    markdown?: string;
    content?: string;
  };
}

@Injectable()
export class FirecrawlService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FirecrawlService.name);
  }

  async scrape(url: string): Promise<IngestedContent> {
    const apiKey = this.config.get<string>('FIRECRAWL_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('FIRECRAWL_API_KEY is not configured');
    }

    const baseUrl = this.config.get<string>('FIRECRAWL_BASE_URL', 'https://api.firecrawl.dev');
    const timeout = this.config.get<number>('FIRECRAWL_TIMEOUT_MS', 15000);
    const start = Date.now();

    try {
      const response = await firstValueFrom(
        this.http.post<FirecrawlResponse>(
          `${baseUrl}/v1/scrape`,
          { url, formats: ['markdown'] },
          { timeout, headers: { Authorization: `Bearer ${apiKey}` } },
        ),
      );
      const elapsed = Date.now() - start;
      const normalized = this.normalize(url, response.data);
      this.logger.info(
        { url, elapsedMs: elapsed, contentSize: normalized.content.length },
        'Firecrawl scrape succeeded',
      );
      return normalized;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error({ err, url }, 'Firecrawl scrape failed');
      throw new ServiceUnavailableException('Failed to scrape source URL');
    }
  }

  private normalize(url: string, data: FirecrawlResponse): IngestedContent {
    if (!data.success || !data.data) {
      throw new ServiceUnavailableException('Firecrawl returned unsuccessful scrape response');
    }

    const content = (data.data.markdown || data.data.content || '').trim().replace(/\n{3,}/g, '\n\n');
    if (content.length < 40) {
      throw new BadRequestException('Source URL content is empty or low signal');
    }
    const maxChars = this.config.get<number>('INGESTION_MAX_CHARS', 12000);

    return {
      title: data.data.title || 'Untitled page',
      canonicalUrl: url,
      content: content.slice(0, maxChars),
      metadata: data.data.metadata || {},
    };
  }
}
