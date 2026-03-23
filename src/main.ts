import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLoggerService } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { RequestContext } from './common/context/request-context';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const pinoLogger = app.get(PinoLoggerService);
  app.useLogger(pinoLogger);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || requestId;

    req.headers[REQUEST_ID_HEADER] = requestId;
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    RequestContext.run({ requestId, correlationId }, () => next());
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((item) => item.trim()) : true,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Earnable Backend API')
    .setDescription('Production API for authentication, user management, health, and LLM integration.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(
    `Listening on port ${port} (NODE_ENV=${config.get<string>('NODE_ENV') ?? 'unknown'})`,
    'Bootstrap',
  );
}

void bootstrap();
