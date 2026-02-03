import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reader_config' })
export class ReaderConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'boolean', default: false })
  legacyEpubEnabled!: boolean;
}
