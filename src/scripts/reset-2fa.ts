import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { UserEntity } from '../auth/entities/user.entity';

async function run() {
  const resetAll = (process.env.RESET_2FA_ALL ?? '').toLowerCase() === 'true';
  const resetUsersRaw = (process.env.RESET_2FA_USER ?? '').trim();
  const resetUsers = resetUsersRaw
    ? resetUsersRaw.split(',').map((value) => value.trim()).filter(Boolean)
    : [];

  if (!resetAll && resetUsers.length === 0) {
    console.error('RESET_2FA_ALL=true or RESET_2FA_USER is required.');
    process.exit(1);
  }

  const settings = new SettingsService().getSettings().database;
  const dataSource = new DataSource({
    type: settings.type,
    database: settings.type === 'sqlite' ? settings.sqlitePath : settings.name,
    host: settings.type === 'postgres' ? settings.host : undefined,
    port: settings.type === 'postgres' ? settings.port : undefined,
    username: settings.type === 'postgres' ? settings.username : undefined,
    password: settings.type === 'postgres' ? settings.password : undefined,
    ssl: settings.type === 'postgres' && settings.ssl ? { rejectUnauthorized: false } : false,
    synchronize: false,
    entities: [UserEntity],
  } as any);

  await dataSource.initialize();
  const repo = dataSource.getRepository(UserEntity);

  if (resetAll) {
    const result = await repo
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      })
      .execute();
    console.log(`Reset 2FA for ${result.affected ?? 0} users.`);
  } else {
    const users = await repo.find();
    const targets = users.filter((user) =>
      resetUsers.some((value) =>
        [user.id, user.username, user.email].filter(Boolean).includes(value),
      ),
    );
    if (!targets.length) {
      console.error('No matching users found for RESET_2FA_USER.');
      await dataSource.destroy();
      process.exit(1);
    }
    for (const user of targets) {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorTempSecret = null;
    }
    await repo.save(targets);
    console.log(`Reset 2FA for ${targets.length} users.`);
  }

  await dataSource.destroy();
}

run().catch((error) => {
  console.error('2FA reset failed:', error);
  process.exit(1);
});
