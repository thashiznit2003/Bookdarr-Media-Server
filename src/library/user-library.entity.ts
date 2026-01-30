import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_library')
@Index(['userId', 'bookId'])
export class UserLibraryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  bookId!: number;

  @Column({ type: 'datetime' })
  checkedOutAt!: string;

  @Column({ type: 'datetime', nullable: true })
  returnedAt?: string | null;
}
