import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOfflineDownloadSha2561770499000000
  implements MigrationInterface
{
  name = 'AddOfflineDownloadSha2561770499000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('offline_downloads');
    const has = Boolean(table?.columns?.some((c) => c.name === 'sha256'));
    if (has) return;

    await queryRunner.addColumn(
      'offline_downloads',
      new TableColumn({
        name: 'sha256',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('offline_downloads');
    const has = Boolean(table?.columns?.some((c) => c.name === 'sha256'));
    if (!has) return;
    await queryRunner.dropColumn('offline_downloads', 'sha256');
  }
}

