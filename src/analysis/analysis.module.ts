import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AnalysisRecord } from './entities/analysis-record.entity';
import { IngestionModule } from '../ingestion/ingestion.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisRecord]), IngestionModule, LlmModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
