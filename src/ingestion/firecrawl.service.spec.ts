import { of, throwError } from 'rxjs';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { FirecrawlService } from './firecrawl.service';

describe('FirecrawlService', () => {
  const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };

  it('normalizes successful scrape output', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        ({ FIRECRAWL_API_KEY: 'x', FIRECRAWL_BASE_URL: 'https://api.firecrawl.dev', FIRECRAWL_TIMEOUT_MS: 1000 }[
          key
        ] ?? fallback),
      ),
    };
    const http = {
      post: jest.fn().mockReturnValue(
        of({ data: { success: true, data: { title: 'T', markdown: 'A very useful content block for testing.' } } }),
      ),
    };
    const service = new FirecrawlService(config as any, http as any, logger as any);
    const result = await service.scrape('https://example.com');
    expect(result.title).toBe('T');
    expect(result.canonicalUrl).toBe('https://example.com');
  });

  it('throws when output is low signal', async () => {
    const config = { get: jest.fn().mockReturnValue('x') };
    const http = {
      post: jest.fn().mockReturnValue(of({ data: { success: true, data: { title: 'T', markdown: 'tiny' } } })),
    };
    const service = new FirecrawlService(config as any, http as any, logger as any);
    await expect(service.scrape('https://example.com')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps scrape transport errors to service unavailable', async () => {
    const config = { get: jest.fn().mockReturnValue('x') };
    const http = { post: jest.fn().mockReturnValue(throwError(() => new Error('network'))) };
    const service = new FirecrawlService(config as any, http as any, logger as any);
    await expect(service.scrape('https://example.com')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
