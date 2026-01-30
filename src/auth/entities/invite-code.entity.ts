import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'invite_codes' })
export class InviteCodeEntity {
  @PrimaryColumn()
  code!: string;

  @Column()
  createdAt!: string;

  @Column({ type: 'text', nullable: true })
  usedAt?: string | null;

  @Column({ type: 'text', nullable: true })
  usedByUserId?: string | null;
}
