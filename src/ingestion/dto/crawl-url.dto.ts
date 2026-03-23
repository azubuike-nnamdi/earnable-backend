import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CrawlUrlDto {
  @ApiProperty({ example: 'https://example.com' })
  @IsUrl()
  url: string;
}
