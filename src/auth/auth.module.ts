import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';
import { SettingsModule } from '../settings/settings.module';
import { UserEntity } from './entities/user.entity';
import { InviteCodeEntity } from './entities/invite-code.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { TwoFactorBackupCodeEntity } from './entities/two-factor-backup-code.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { JwtStrategy } from './jwt.strategy';
import { AuthGuard } from './auth.guard';
import { AuthConfigEntity } from './auth-config.entity';
import { AuthConfigService } from './auth-config.service';
import { AdminGuard } from './admin.guard';
import { UsersController } from './users.controller';
import { AuthSettingsController } from './auth-settings.controller';
import { MeController } from './me.controller';
import { LoggingModule } from '../logging/logging.module';
import { ApiV1AuthController } from './api-v1-auth.controller';
import { ApiV1MeController } from './api-v1-me.controller';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { StreamAuthGuard } from './stream-auth.guard';

@Module({
  imports: [
    forwardRef(() => SettingsModule),
    LoggingModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      UserEntity,
      InviteCodeEntity,
      PasswordResetTokenEntity,
      TwoFactorBackupCodeEntity,
      AuthSessionEntity,
      AuthConfigEntity,
    ]),
  ],
  controllers: [
    AuthController,
    ApiV1AuthController,
    UsersController,
    AuthSettingsController,
    MeController,
    ApiV1MeController,
  ],
  providers: [
    AuthService,
    MailerService,
    JwtStrategy,
    AuthGuard,
    AuthConfigService,
    AdminGuard,
    RateLimitService,
    RateLimitGuard,
    StreamAuthGuard,
  ],
  exports: [
    AuthGuard,
    StreamAuthGuard,
    AuthService,
    AuthConfigService,
    JwtModule,
    AdminGuard,
    RateLimitGuard,
  ],
})
export class AuthModule {}
