import { Module, forwardRef } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { BookdarrModule } from '../bookdarr/bookdarr.module';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmtpConfigEntity } from './smtp-config.entity';
import { SmtpConfigService } from './smtp-config.service';
import { SmtpConfigController } from './smtp-config.controller';
import { UserEntity } from '../auth/entities/user.entity';

@Module({
  imports: [
    forwardRef(() => BookdarrModule),
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([SmtpConfigEntity, UserEntity]),
  ],
  controllers: [SettingsController, SmtpConfigController],
  providers: [SettingsService, SmtpConfigService],
  exports: [SettingsService, SmtpConfigService],
})
export class SettingsModule {}
