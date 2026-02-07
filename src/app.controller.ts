import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import { FileLoggerService } from './logging/file-logger.service';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly logger: FileLoggerService,
  ) {}

  @Get()
  async getIndex(@Req() req: Request, @Res() res: Response) {
    this.logger.info('app_index_enter', {
      authParam: req.query?.auth ?? null,
      hasCookieAccess: Boolean(this.readCookie(req, 'bmsAccessToken')),
      hasCookieRefresh: Boolean(this.readCookie(req, 'bmsRefreshToken')),
    });
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      const authParam = req.query?.auth;
      if (authParam === '1') {
        this.logger.warn('app_index_auth_failed', { authParam });
        return res.redirect('/login?reason=authfail');
      }
      this.logger.info('app_index_redirect_login', { authParam });
      return res.redirect('/login');
    }
    this.logger.info('app_index_bootstrap_ok', {
      userId: bootstrap?.user?.id ?? null,
    });
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
    return res.send(this.appService.getIndexHtml(bootstrap));
  }

  @Get('login')
  async getLogin(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (bootstrap?.user) {
      return res.redirect('/');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
    return res.send(this.appService.getLoginHtml());
  }

  @Get(['settings', 'accounts', 'my-library'])
  async getPage(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
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

  private setNoCacheHeaders(res: Response) {
    res.setHeader(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('pragma', 'no-cache');
    res.setHeader('expires', '0');
    res.setHeader('surrogate-control', 'no-store');
  }

  private async buildBootstrap(req: Request) {
    const accessToken = this.readCookie(req, 'bmsAccessToken');
    if (!accessToken) {
      return { user: null };
    }
    const user = await this.authService.verifyAccessTokenForBootstrap(accessToken);
    return { user };
  }
}
