import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  secretHash!: string;

  @Column()
  userId!: string;

  @Column('bigint')
  expiresAt!: number;

  @Column({ type: 'text', nullable: true })
  usedAt?: string | null;

  @Column()
  createdAt!: string;
}
