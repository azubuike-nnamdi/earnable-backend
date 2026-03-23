import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirecrawlService } from './firecrawl.service';
import { IngestionRecord } from './entities/ingestion-record.entity';

@Injectable()
export class IngestionService {
  constructor(
    private readonly firecrawl: FirecrawlService,
    @InjectRepository(IngestionRecord) private readonly ingestionRepo: Repository<IngestionRecord>,
  ) {}

  async crawlAndSave(url: string): Promise<IngestionRecord> {
    const scraped = await this.firecrawl.scrape(url);
    const entity = this.ingestionRepo.create({
      url,
      title: scraped.title,
      canonicalUrl: scraped.canonicalUrl,
      content: scraped.content,
      metadata: scraped.metadata,
      status: 'completed',
    });
    return this.ingestionRepo.save(entity);
  }

  async getById(id: string): Promise<IngestionRecord> {
    const ingestion = await this.ingestionRepo.findOne({ where: { id } });
    if (!ingestion) {
      throw new NotFoundException('Ingestion record not found');
    }
    return ingestion;
  }
}
