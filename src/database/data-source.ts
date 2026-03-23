import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { IngestionRecord } from '../ingestion/entities/ingestion-record.entity';
import { AnalysisRecord } from '../analysis/entities/analysis-record.entity';

const isDev = process.env.NODE_ENV === 'development';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, IngestionRecord, AnalysisRecord],
  synchronize: false,
  migrationsTableName: 'migrations',
  migrations: [isDev ? 'src/database/migrations/*.ts' : 'dist/src/database/migrations/*.js'],
});
