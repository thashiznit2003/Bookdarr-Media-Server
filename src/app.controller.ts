import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';
import { AuthConfigService } from './auth/auth-config.service';
import { SettingsService } from './settings/settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authConfigService: AuthConfigService,
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async getIndex(@Req() req: Request, @Res() res: Response) {
    const queryAccessRaw = typeof req.query?.access === 'string' ? req.query.access : undefined;
    const queryRefreshRaw = typeof req.query?.refresh === 'string' ? req.query.refresh : undefined;
    const queryAccess = queryAccessRaw ? decodeURIComponent(queryAccessRaw) : undefined;
    const queryRefresh = queryRefreshRaw ? decodeURIComponent(queryRefreshRaw) : undefined;
    if (queryAccess) {
      this.setAuthCookies(res, queryAccess, queryRefresh);
      const bootstrap = await this.buildBootstrap(req, queryAccess, queryRefresh);
      if (bootstrap?.user) {
        return res.redirect('/');
      }
      return res.redirect('/login?reason=authfail');
    }
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      const authParam = req.query?.auth;
      if (authParam === '1') {
        return res.redirect('/login?reason=authfail');
      }
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.send(this.appService.getIndexHtml(bootstrap));
  }

  @Get('login')
  async getLogin(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (bootstrap?.user) {
      return res.redirect('/');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.send(this.appService.getLoginHtml());
  }

  @Get(['settings', 'accounts', 'my-library'])
  async getPage(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.send(this.appService.getIndexHtml(bootstrap));
  }

  @Get('diagnostics')
  async redirectDiagnostics(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    return res.redirect('/settings');
  }

  @Get('downloads')
  async redirectDownloads(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    return res.redirect('/my-library');
  }

  private readCookie(req: Request, name: string): string | undefined {
    const raw = req.headers?.cookie;
    if (!raw) return undefined;
    const match = raw
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!match) return undefined;
    return decodeURIComponent(match.slice(name.length + 1));
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken?: string) {
    const options = {
      httpOnly: false,
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    };
    res.cookie('bmsAccessToken', accessToken, options);
    if (refreshToken) {
      res.cookie('bmsRefreshToken', refreshToken, options);
    }
    res.cookie('bmsLoggedIn', '1', options);
  }

  private async buildBootstrap(req: Request, accessOverride?: string, refreshOverride?: string) {
    const accessToken = accessOverride ?? this.readCookie(req, 'bmsAccessToken');
    const refreshToken = refreshOverride ?? this.readCookie(req, 'bmsRefreshToken');
    if (!accessToken) {
      return { token: null, refreshToken: null, user: null };
    }
    try {
      const auth = this.settingsService.getSettings().auth;
      const secrets = await this.authConfigService.getSecrets();
      const secret = secrets.accessSecret ?? auth.accessSecret;
      if (!secret) {
        return { token: null, refreshToken: null, user: null };
      }
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username?: string;
        email?: string;
        isAdmin?: boolean;
      }>(accessToken, { secret });
      return {
        token: accessToken,
        refreshToken,
        user: {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
          isAdmin: Boolean(payload.isAdmin),
        },
      };
    } catch {
      return { token: null, refreshToken: null, user: null };
    }
  }
}
