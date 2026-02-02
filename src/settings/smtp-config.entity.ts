import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'smtp_config' })
export class SmtpConfigEntity {
  @PrimaryColumn()
  id!: number;

  @Column()
  host!: string;

  @Column({ type: 'integer' })
  port!: number;

  @Column()
  user!: string;

  @Column({ type: 'text' })
  pass!: string;

  @Column({ type: 'text', nullable: true })
  from?: string | null;

  @Column({ type: 'text', nullable: true })
  fromName?: string | null;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;
}
