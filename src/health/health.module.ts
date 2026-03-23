import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TerminusModule, HttpModule, LlmModule],
  controllers: [HealthController],
})
export class HealthModule {}
