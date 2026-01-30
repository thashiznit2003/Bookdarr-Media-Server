import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtGuard: JwtAuthGuard;

  constructor(private readonly settingsService: SettingsService) {
    this.jwtGuard = new JwtAuthGuard();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authConfigured = Boolean(
      this.settingsService.getSettings().auth.accessSecret,
    );
    if (!authConfigured) {
      return true;
    }

    return this.jwtGuard.canActivate(context);
  }
}
