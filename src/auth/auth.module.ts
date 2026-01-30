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
import { JwtStrategy } from './jwt.strategy';
import { AuthGuard } from './auth.guard';
import { AuthConfigEntity } from './auth-config.entity';
import { AuthConfigService } from './auth-config.service';
import { AdminGuard } from './admin.guard';
import { UsersController } from './users.controller';
import { AuthSettingsController } from './auth-settings.controller';

@Module({
  imports: [
    forwardRef(() => SettingsModule),
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      UserEntity,
      InviteCodeEntity,
      PasswordResetTokenEntity,
      AuthConfigEntity,
    ]),
  ],
  controllers: [AuthController, UsersController, AuthSettingsController],
  providers: [
    AuthService,
    MailerService,
    JwtStrategy,
    AuthGuard,
    AuthConfigService,
    AdminGuard,
  ],
  exports: [AuthGuard, AuthConfigService],
})
export class AuthModule {}
