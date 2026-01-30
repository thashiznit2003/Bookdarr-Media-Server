import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettingsModule } from './settings/settings.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { AuthModule } from './auth/auth.module';
import { SettingsService } from './settings/settings.service';
import { UserEntity } from './auth/entities/user.entity';
import { InviteCodeEntity } from './auth/entities/invite-code.entity';
import { PasswordResetTokenEntity } from './auth/entities/password-reset-token.entity';
import { LibraryModule } from './library/library.module';
import { BookdarrConfigEntity } from './bookdarr/bookdarr-config.entity';

@Module({
  imports: [
    SettingsModule,
    TypeOrmModule.forRootAsync({
      imports: [SettingsModule],
      inject: [SettingsService],
      useFactory: (settingsService: SettingsService) => {
        const db = settingsService.getSettings().database;
        if (db.type === 'postgres') {
          return {
            type: 'postgres',
            host: db.host,
            port: db.port,
            username: db.username,
            password: db.password,
            database: db.name,
            ssl: db.ssl ? { rejectUnauthorized: false } : false,
            synchronize: db.synchronize,
            entities: [
              UserEntity,
              InviteCodeEntity,
              PasswordResetTokenEntity,
              BookdarrConfigEntity,
            ],
          };
        }

        return {
          type: 'sqlite',
          database: db.sqlitePath,
          synchronize: db.synchronize,
          entities: [
            UserEntity,
            InviteCodeEntity,
            PasswordResetTokenEntity,
            BookdarrConfigEntity,
          ],
        };
      },
    }),
    DiagnosticsModule,
    AuthModule,
    LibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
