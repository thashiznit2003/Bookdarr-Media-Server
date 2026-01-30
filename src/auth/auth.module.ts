import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, MailerService],
})
export class AuthModule {}
