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

@Module({
  imports: [
    forwardRef(() => SettingsModule),
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      UserEntity,
      InviteCodeEntity,
      PasswordResetTokenEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtStrategy, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
