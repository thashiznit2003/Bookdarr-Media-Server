import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'two_factor_backup_codes' })
export class TwoFactorBackupCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  userId!: string;

  // Argon2id hash of the normalized code (we never store raw codes).
  @Column({ type: 'text' })
  codeHash!: string;

  @Column({ type: 'text' })
  createdAt!: string;

  @Column({ type: 'text', nullable: true })
  usedAt?: string | null;
}

