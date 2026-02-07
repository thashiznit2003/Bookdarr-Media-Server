import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'auth_sessions' })
export class AuthSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // sessionId (stable per device)

  @Column({ type: 'text' })
  userId!: string;

  // Current refresh token id (JWT jti) for this session; rotates on every refresh.
  @Column({ type: 'text', nullable: true })
  refreshTokenId?: string | null;

  @Column({ type: 'text' })
  createdAt!: string;

  @Column({ type: 'text' })
  lastUsedAt!: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ type: 'text', nullable: true })
  createdIp?: string | null;

  @Column({ type: 'text', nullable: true })
  lastIp?: string | null;

  @Column({ type: 'text', nullable: true })
  revokedAt?: string | null;

  @Column({ type: 'text', nullable: true })
  revokeReason?: string | null;
}

