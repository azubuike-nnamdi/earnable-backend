import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().required(),

  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  CORS_ORIGIN: Joi.string().optional(),

  LLM_PROVIDER: Joi.string().valid('ollama', 'openai').default('ollama'),
  OLLAMA_BASE_URL: Joi.string().uri().default('http://localhost:11434'),
  OLLAMA_MODEL: Joi.string().default('llama3.2'),
  LLM_TIMEOUT_MS: Joi.number().default(15000),
  OPENAI_API_KEY: Joi.when('LLM_PROVIDER', {
    is: 'openai',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  INGESTION_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  FIRECRAWL_BASE_URL: Joi.string().uri().default('https://api.firecrawl.dev'),
  FIRECRAWL_TIMEOUT_MS: Joi.number().default(15000),
  INGESTION_MAX_CHARS: Joi.number().default(12000),
  FIRECRAWL_API_KEY: Joi.when('INGESTION_ENABLED', {
    is: true,
    then: Joi.string().trim().min(1).required(),
    otherwise: Joi.string().allow('').optional(),
  }),

  THROTTLE_AUTH_TTL: Joi.number().default(60),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),
  THROTTLE_DEFAULT_TTL: Joi.number().default(60),
  THROTTLE_DEFAULT_LIMIT: Joi.number().default(100),
});
