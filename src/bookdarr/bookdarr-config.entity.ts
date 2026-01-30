import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'bookdarr_config' })
export class BookdarrConfigEntity {
  @PrimaryColumn()
  id!: number;

  @Column()
  apiUrl!: string;

  @Column()
  apiKey!: string;

  @Column({ type: 'text', nullable: true })
  poolPath?: string | null;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;
}
