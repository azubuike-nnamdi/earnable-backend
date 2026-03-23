import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirecrawlService } from './firecrawl.service';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionRecord } from './entities/ingestion-record.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([IngestionRecord])],
  controllers: [IngestionController],
  providers: [FirecrawlService, IngestionService],
  exports: [FirecrawlService, IngestionService],
})
export class IngestionModule {}
