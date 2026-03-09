import { Module } from '@nestjs/common';
import { envValidationSchema } from './env.validator';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
  ],
})
export class AppConfigModule {}
