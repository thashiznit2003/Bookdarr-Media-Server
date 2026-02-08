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
    const nonce = (res.locals as any)?.cspNonce as string | undefined;
    return res.send(this.appService.getIndexHtml(bootstrap, { cspNonce: nonce }));
  }

  @Get('login')
  async getLogin(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (bootstrap?.user) {
      return res.redirect('/');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
    const nonce = (res.locals as any)?.cspNonce as string | undefined;
    return res.send(this.appService.getLoginHtml({ cspNonce: nonce }));
  }

  @Get(['settings', 'my-library'])
  async getPage(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
    const nonce = (res.locals as any)?.cspNonce as string | undefined;
    return res.send(this.appService.getIndexHtml(bootstrap, { cspNonce: nonce }));
  }

  @Get('accounts')
  async getAccounts(@Req() req: Request, @Res() res: Response) {
    const bootstrap = await this.buildBootstrap(req);
    if (!bootstrap?.user) {
      return res.redirect('/login');
    }
    if (!bootstrap.user.isAdmin) {
      res.setHeader('content-type', 'text/html; charset=utf-8');
      this.setNoCacheHeaders(res);
      return res.status(403).send(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>BMS - Forbidden</title>
            <style>
              body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #0b1220; color: #e5e7eb; }
              .wrap { max-width: 720px; margin: 12vh auto; padding: 24px; }
              .card { border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.03); padding: 20px; }
              h1 { margin: 0 0 10px; font-size: 22px; }
              p { margin: 0 0 14px; color: rgba(229,231,235,0.85); line-height: 1.5; }
              a { color: #93c5fd; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .hint { font-size: 12px; color: rgba(229,231,235,0.6); }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="card">
                <h1>Not authorized</h1>
                <p>Your account does not have access to Accounts.</p>
                <p><a href="/">Return to Book Pool</a></p>
                <div class="hint">Status: 403</div>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    this.setNoCacheHeaders(res);
    const nonce = (res.locals as any)?.cspNonce as string | undefined;
    return res.send(this.appService.getIndexHtml(bootstrap, { cspNonce: nonce }));
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
