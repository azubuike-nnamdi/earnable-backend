import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RunAnalysisDto {
  @ApiProperty()
  @IsUUID()
  ingestionId: string;

  @ApiPropertyOptional({ default: 'enterprise-positioning' })
  @IsOptional()
  @IsString()
  analysisType?: string;
}
