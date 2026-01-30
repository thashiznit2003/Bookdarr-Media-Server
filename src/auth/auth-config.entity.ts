import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_config' })
export class AuthConfigEntity {
  @PrimaryColumn('int')
  id!: number;

  @Column({ type: 'text', nullable: true })
  accessSecret?: string | null;

  @Column({ type: 'text', nullable: true })
  refreshSecret?: string | null;

  @Column({ type: 'text' })
  updatedAt!: string;
}
