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

  @Column()
  createdAt!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  refreshTokenId?: string | null;
}
