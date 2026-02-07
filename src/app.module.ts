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
import { AuthConfigEntity } from './auth/auth-config.entity';
import { LoggingModule } from './logging/logging.module';
import { UserLibraryEntity } from './library/user-library.entity';
import { OfflineDownloadEntity } from './library/offline-download.entity';
import { SmtpConfigEntity } from './settings/smtp-config.entity';
import { ReaderProgressEntity } from './library/reader-progress.entity';
import { TwoFactorBackupCodeEntity } from './auth/entities/two-factor-backup-code.entity';

@Module({
  imports: [
    SettingsModule,
    LoggingModule,
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
              TwoFactorBackupCodeEntity,
              BookdarrConfigEntity,
              AuthConfigEntity,
              UserLibraryEntity,
              OfflineDownloadEntity,
              SmtpConfigEntity,
              ReaderProgressEntity,
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
            TwoFactorBackupCodeEntity,
            BookdarrConfigEntity,
            AuthConfigEntity,
            UserLibraryEntity,
            OfflineDownloadEntity,
            SmtpConfigEntity,
            ReaderProgressEntity,
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
