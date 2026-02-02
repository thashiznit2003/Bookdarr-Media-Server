import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  username?: string | null;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column()
  createdAt!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  refreshTokenId?: string | null;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'text', nullable: true })
  twoFactorSecret?: string | null;

  @Column({ type: 'text', nullable: true })
  twoFactorTempSecret?: string | null;
}
