import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reader_progress' })
@Index(['userId', 'kind', 'fileId'], { unique: true })
export class ReaderProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  kind!: string;

  @Column({ type: 'text' })
  fileId!: string;

  @Column({ type: 'text', nullable: true })
  data!: string | null;

  @Column({ type: 'integer' })
  updatedAt!: number;
}
