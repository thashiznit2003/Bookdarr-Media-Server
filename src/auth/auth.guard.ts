import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthConfigService } from './auth-config.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtGuard: JwtAuthGuard;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly authConfigService: AuthConfigService,
  ) {
    this.jwtGuard = new JwtAuthGuard();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const auth = this.settingsService.getSettings().auth;
    const secrets = await this.authConfigService.getSecrets();
    const authConfigured = Boolean(
      secrets.accessSecret ?? auth.accessSecret,
    );
    if (!authConfigured) {
      return true;
    }

    return this.jwtGuard.canActivate(context) as Promise<boolean>;
  }
}
