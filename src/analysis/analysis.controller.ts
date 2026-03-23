import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@ApiTags('analysis')
@ApiBearerAuth()
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run enterprise analysis from a saved ingestion id' })
  run(@Body() dto: RunAnalysisDto) {
    return this.analysisService.run(dto.ingestionId, dto.analysisType);
  }
}
