import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrawlUrlDto } from './dto/crawl-url.dto';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@ApiBearerAuth()
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('crawl')
  @ApiOperation({ summary: 'Crawl a URL, persist normalized content, return ingestion id' })
  async crawl(@Body() dto: CrawlUrlDto) {
    const saved = await this.ingestionService.crawlAndSave(dto.url);
    return {
      ingestionId: saved.id,
      status: saved.status,
      title: saved.title,
      canonicalUrl: saved.canonicalUrl,
      contentLength: saved.content.length,
      createdAt: saved.createdAt,
    };
  }
}
