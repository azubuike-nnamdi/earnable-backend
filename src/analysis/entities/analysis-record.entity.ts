import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IngestionRecord } from '../../ingestion/entities/ingestion-record.entity';

@Entity({ name: 'analysis_record' })
export class AnalysisRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ingestionId: string;

  @ManyToOne(() => IngestionRecord, { onDelete: 'CASCADE' })
  ingestion: IngestionRecord;

  @Column({ type: 'varchar', length: 80, default: 'enterprise-positioning' })
  analysisType: string;

  @Column({ type: 'jsonb' })
  result: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
