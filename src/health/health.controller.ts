import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common';
import { RedisService } from '../redis/redis.service';
import { LlmService } from '../llm/llm.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly typeOrm: TypeOrmHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly llmService: LlmService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check Postgres, Redis, and Ollama availability' })
  check() {
    const ollamaBaseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    return this.health.check([
      () => this.typeOrm.pingCheck('postgres'),
      async () => {
        const pong = await this.redisService.ping();
        if (pong !== 'PONG') {
          throw new ServiceUnavailableException('Redis health check failed');
        }
        return { redis: { status: 'up' } };
      },
      async () => {
        await this.http.pingCheck('ollama-http', `${ollamaBaseUrl}/api/tags`, {
          timeout: 5000,
        });
        await this.llmService.health();
        return { llm: { status: 'up', provider: this.config.get<string>('LLM_PROVIDER', 'ollama') } };
      },
    ]);
  }
}
