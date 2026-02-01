import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type OfflineDownloadStatus = 'queued' | 'downloading' | 'ready' | 'failed';

@Entity('offline_downloads')
@Index(['userId', 'bookId'])
@Index(['userId', 'fileId'])
export class OfflineDownloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  bookId!: number;

  @Column()
  fileId!: number;

  @Column()
  fileName!: string;

  @Column()
  mediaType!: string;

  @Column()
  status!: OfflineDownloadStatus;

  @Column({ type: 'integer', default: 0 })
  bytesTotal!: number;

  @Column({ type: 'integer', default: 0 })
  bytesDownloaded!: number;

  @Column()
  filePath!: string;

  @Column({ nullable: true })
  error?: string | null;

  @Column({ type: 'datetime' })
  createdAt!: string;

  @Column({ type: 'datetime' })
  updatedAt!: string;
}
