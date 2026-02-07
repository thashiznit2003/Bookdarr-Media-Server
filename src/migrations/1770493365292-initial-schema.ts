import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1770493365292 implements MigrationInterface {
  name = 'InitialSchema1770493365292';

  private isPostgres(queryRunner: QueryRunner) {
    return (queryRunner.connection.options as any)?.type === 'postgres';
  }

  private uuidType(queryRunner: QueryRunner) {
    // SQLite does not have a native UUID type; TypeORM typically stores it as varchar/text.
    return this.isPostgres(queryRunner) ? 'uuid' : 'varchar';
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ) {
    const table = await queryRunner.getTable(tableName);
    const has = Boolean(table?.indices?.some((idx) => idx.name === index.name));
    if (!has) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  async up(queryRunner: QueryRunner): Promise<void> {
    const uuid = this.uuidType(queryRunner);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'username', type: 'text', isNullable: true, isUnique: true },
          { name: 'email', type: 'text', isNullable: false, isUnique: true },
          { name: 'passwordHash', type: 'text', isNullable: false },
          { name: 'isAdmin', type: 'boolean', default: false },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'refreshTokenId', type: 'text', isNullable: true },
          { name: 'tokenVersion', type: 'integer', default: 0 },
          { name: 'twoFactorEnabled', type: 'boolean', default: false },
          { name: 'twoFactorSecret', type: 'text', isNullable: true },
          { name: 'twoFactorTempSecret', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'invite_codes',
        columns: [
          { name: 'code', type: 'text', isPrimary: true },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'usedAt', type: 'text', isNullable: true },
          { name: 'usedByUserId', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'secretHash', type: 'text', isNullable: false },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'expiresAt', type: 'bigint', isNullable: false },
          { name: 'usedAt', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'two_factor_backup_codes',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'codeHash', type: 'text', isNullable: false },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'usedAt', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'auth_sessions',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'refreshTokenId', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'lastUsedAt', type: 'text', isNullable: false },
          { name: 'userAgent', type: 'text', isNullable: true },
          { name: 'createdIp', type: 'text', isNullable: true },
          { name: 'lastIp', type: 'text', isNullable: true },
          { name: 'revokedAt', type: 'text', isNullable: true },
          { name: 'revokeReason', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'auth_config',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'accessSecret', type: 'text', isNullable: true },
          { name: 'refreshSecret', type: 'text', isNullable: true },
          { name: 'updatedAt', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'bookdarr_config',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'apiUrl', type: 'text', isNullable: false },
          { name: 'apiKey', type: 'text', isNullable: false },
          { name: 'poolPath', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'updatedAt', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'smtp_config',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'host', type: 'text', isNullable: false },
          { name: 'port', type: 'integer', isNullable: false },
          { name: 'user', type: 'text', isNullable: false },
          { name: 'pass', type: 'text', isNullable: false },
          { name: 'from', type: 'text', isNullable: true },
          { name: 'fromName', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'updatedAt', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'reader_config',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'legacyEpubEnabled', type: 'boolean', default: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_library',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'bookId', type: 'integer', isNullable: false },
          { name: 'checkedOutAt', type: 'text', isNullable: false },
          { name: 'returnedAt', type: 'text', isNullable: true },
          { name: 'readAt', type: 'text', isNullable: true },
        ],
      }),
      true,
    );
    await this.ensureIndex(
      queryRunner,
      'user_library',
      new TableIndex({
        name: 'idx_user_library_user_book',
        columnNames: ['userId', 'bookId'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'offline_downloads',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'bookId', type: 'integer', isNullable: false },
          { name: 'fileId', type: 'integer', isNullable: false },
          { name: 'fileName', type: 'text', isNullable: false },
          { name: 'mediaType', type: 'text', isNullable: false },
          { name: 'status', type: 'text', isNullable: false },
          { name: 'bytesTotal', type: 'integer', default: 0 },
          { name: 'bytesDownloaded', type: 'integer', default: 0 },
          { name: 'filePath', type: 'text', isNullable: false },
          { name: 'error', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'text', isNullable: false },
          { name: 'updatedAt', type: 'text', isNullable: false },
        ],
      }),
      true,
    );
    await this.ensureIndex(
      queryRunner,
      'offline_downloads',
      new TableIndex({
        name: 'idx_offline_downloads_user_book',
        columnNames: ['userId', 'bookId'],
      }),
    );
    await this.ensureIndex(
      queryRunner,
      'offline_downloads',
      new TableIndex({
        name: 'idx_offline_downloads_user_file',
        columnNames: ['userId', 'fileId'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'reader_progress',
        columns: [
          { name: 'id', type: uuid, isPrimary: true },
          { name: 'userId', type: 'text', isNullable: false },
          { name: 'kind', type: 'text', isNullable: false },
          { name: 'fileId', type: 'text', isNullable: false },
          { name: 'data', type: 'text', isNullable: true },
          { name: 'updatedAt', type: 'integer', isNullable: false },
        ],
      }),
      true,
    );
    await this.ensureIndex(
      queryRunner,
      'reader_progress',
      new TableIndex({
        name: 'ux_reader_progress_user_kind_file',
        columnNames: ['userId', 'kind', 'fileId'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort rollback for dev. Production roll-forward is preferred.
    for (const name of [
      'reader_progress',
      'offline_downloads',
      'user_library',
      'reader_config',
      'smtp_config',
      'bookdarr_config',
      'auth_config',
      'auth_sessions',
      'two_factor_backup_codes',
      'password_reset_tokens',
      'invite_codes',
      'users',
    ]) {
      const has = await queryRunner.hasTable(name);
      if (has) {
        await queryRunner.dropTable(name);
      }
    }
  }
}
