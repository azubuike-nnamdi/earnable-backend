import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LlmTaskType } from '../llm.interface';

enum TaskType {
  GENERAL = 'general',
  SITE_ANALYSIS = 'site-analysis',
  JSON_FIX = 'json-fix',
}

enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

enum TemplateVersion {
  V1 = 'v1',
  V2 = 'v2',
}

class LlmMessageDto {
  @ApiProperty({ enum: MessageRole })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class LlmCompleteDto {
  @ApiProperty({ type: [LlmMessageDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => LlmMessageDto)
  messages?: LlmMessageDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number;

  @ApiProperty({ required: false, enum: TaskType })
  @IsOptional()
  @IsEnum(TaskType)
  taskType?: LlmTaskType;

  @ApiProperty({ required: false, enum: TemplateVersion })
  @IsOptional()
  @IsEnum(TemplateVersion)
  templateVersion?: TemplateVersion;

  @ApiProperty({ required: false, type: Object, additionalProperties: true })
  @IsOptional()
  @IsObject()
  responseSchema?: {
    type: 'object';
    required?: string[];
    properties: Record<string, unknown>;
  };

  @ApiProperty({ required: false, description: 'Optional URL to scrape and inject into prompt context' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}
