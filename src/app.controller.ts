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
    const bootstrap = await this.buildBootstrap(req);
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

  @Get(['downloads', 'diagnostics', 'settings', 'accounts', 'my-library'])
  async getPage(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.send(this.appService.getIndexHtml(bootstrap));
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

  private async buildBootstrap(req: Request) {
    const accessToken = this.readCookie(req, 'bmsAccessToken');
    const refreshToken = this.readCookie(req, 'bmsRefreshToken');
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
