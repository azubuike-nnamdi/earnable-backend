import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER, RequestContext } from './common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { LlmModule } from './llm/llm.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          genReqId: (req, res) => {
            const headerId = req.headers[REQUEST_ID_HEADER] as string | undefined;
            const requestId = headerId || randomUUID();
            res.setHeader(REQUEST_ID_HEADER, requestId);
            return requestId;
          },
          customProps: (req) => {
            const context = RequestContext.get();
            const correlationId =
              context?.correlationId || (req.headers[CORRELATION_ID_HEADER] as string) || req.id;

            return {
              requestId: req.id,
              correlationId,
            };
          },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_DEFAULT_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_DEFAULT_LIMIT', 100),
        },
      ],
    }),
    DatabaseModule,
    RedisModule,
    LlmModule,
    IngestionModule,
    AnalysisModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
