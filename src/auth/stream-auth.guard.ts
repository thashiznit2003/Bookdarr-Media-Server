import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthConfigService } from './auth-config.service';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from './auth.service';

@Injectable()
export class StreamAuthGuard implements CanActivate {
  private readonly jwtGuard: JwtAuthGuard;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly authConfigService: AuthConfigService,
    private readonly authService: AuthService,
  ) {
    this.jwtGuard = new JwtAuthGuard();
  }

  private readCookie(req: Request, name: string) {
    const raw = req.headers?.cookie;
    if (!raw) return undefined;
    const match = raw
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!match) return undefined;
    return decodeURIComponent(match.slice(name.length + 1));
  }

  private isSecureRequest(req: Request) {
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined) ??
      req.protocol ??
      'http';
    return proto === 'https';
  }

  private setAuthCookies(
    req: Request,
    res: Response,
    tokens?: { accessToken?: string; refreshToken?: string },
  ) {
    if (!tokens?.accessToken) return;
    const secure = this.isSecureRequest(req);
    const options = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    } as const;
    res.cookie('bmsAccessToken', tokens.accessToken, options);
    if (tokens.refreshToken) {
      res.cookie('bmsRefreshToken', tokens.refreshToken, options);
    }
    res.cookie('bmsLoggedIn', '1', { ...options, httpOnly: false });
  }

  private getClientMeta(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    let ip: string | null = null;
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      ip = forwarded.split(',')[0]?.trim() ?? null;
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = forwarded[0]?.split(',')[0]?.trim() ?? null;
    } else {
      ip = (req.ip as string | undefined) ?? req.socket?.remoteAddress ?? null;
    }
    const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;
    return { ip, userAgent };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const auth = this.settingsService.getSettings().auth;
    const secrets = await this.authConfigService.getSecrets();
    const authConfigured = Boolean(secrets.accessSecret ?? auth.accessSecret);
    if (!authConfigured) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    try {
      return (await this.jwtGuard.canActivate(context)) as boolean;
    } catch (error) {
      // Media playback / Range fetches can outlive access token TTL. If a refresh cookie exists,
      // refresh server-side and retry auth so the stream stays uninterrupted.
      const alreadyAttempted = Boolean((req as any)._bmsStreamRefreshAttempted);
      if (alreadyAttempted) {
        throw new UnauthorizedException('Unauthorized.');
      }
      (req as any)._bmsStreamRefreshAttempted = true;

      const refreshToken = this.readCookie(req, 'bmsRefreshToken');
      if (!refreshToken) {
        throw new UnauthorizedException('Unauthorized.');
      }

      const refreshed = await this.authService.refresh(
        { refreshToken },
        this.getClientMeta(req),
      );
      this.setAuthCookies(req, res, refreshed.tokens);

      // Ensure the retried auth sees the new token even though cookies won't be part of this request.
      if (refreshed.tokens?.accessToken) {
        (req as any).headers = req.headers ?? {};
        (req.headers as any).authorization = `Bearer ${refreshed.tokens.accessToken}`;
      }
      delete (req as any).user;

      try {
        return (await this.jwtGuard.canActivate(context)) as boolean;
      } catch {
        // Avoid leaking raw passport errors (they can contain circular refs).
        throw new UnauthorizedException('Unauthorized.');
      }
    }
  }
}
