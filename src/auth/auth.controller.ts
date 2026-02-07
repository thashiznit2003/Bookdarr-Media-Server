import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { FileLoggerService } from '../logging/file-logger.service';
import { AuthGuard } from './auth.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimit } from './rate-limit.decorator';
import qrcode from 'qrcode';
import type {
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SetupRequest,
  SignupRequest,
  TwoFactorLoginRequest,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: FileLoggerService,
  ) {}

  private static readonly COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

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
    if (!tokens?.accessToken) {
      return;
    }
    const secure = this.isSecureRequest(req);
    const options = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      maxAge: AuthController.COOKIE_MAX_AGE_MS,
      path: '/',
    } as const;
    res.cookie('bmsAccessToken', tokens.accessToken, options);
    if (tokens.refreshToken) {
      res.cookie('bmsRefreshToken', tokens.refreshToken, options);
    }
    res.cookie('bmsLoggedIn', '1', {
      ...options,
      // Non-sensitive; used only as a signed-in hint for server-side redirects.
      httpOnly: false,
    });
  }

  private setTwoFactorCookie(req: Request, res: Response, token?: string) {
    const secure = this.isSecureRequest(req);
    const options = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 5,
      path: '/',
    } as const;
    if (token) {
      res.cookie('bmsTwoFactor', token, options);
    } else {
      // Clear both secure and non-secure variants to avoid sticky cookies.
      res.clearCookie('bmsTwoFactor', { path: '/', sameSite: 'lax' as const });
      res.clearCookie('bmsTwoFactor', {
        path: '/',
        sameSite: 'lax' as const,
        secure: true,
      });
    }
  }

  private readTwoFactorCookie(req: Request) {
    return this.readCookie(req, 'bmsTwoFactor');
  }

  private clearAuthCookies(req: Request, res: Response) {
    const base = { path: '/', sameSite: 'lax' as const };
    // Clear both secure and non-secure variants to avoid "sticky" cookies across envs.
    for (const secure of [false, true]) {
      const options = { ...base, secure };
      res.clearCookie('bmsAccessToken', options);
      res.clearCookie('bmsRefreshToken', options);
      res.clearCookie('bmsLoggedIn', options);
      res.clearCookie('bmsTwoFactor', options);
    }
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

  private getBaseUrl(req: Request) {
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined) ??
      req.protocol ??
      'http';
    const host =
      (req.headers['x-forwarded-host'] as string | undefined) ??
      req.get('host');
    if (!host) return undefined;
    return `${proto}://${host}`;
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

  @Post('signup')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'auth_signup_ip', max: 30, windowMs: 60 * 60 * 1000, scope: 'ip' },
    { id: 'auth_signup_email', max: 10, windowMs: 60 * 60 * 1000, scope: 'ip+email' },
  ])
  async signup(
    @Body() request: SignupRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.signup(request, this.getClientMeta(req));
    this.setAuthCookies(req, res, response.tokens);
    return response;
  }

  @Get('setup')
  async setupStatus() {
    return { required: await this.authService.isSetupRequired() };
  }

  @Post('setup')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_setup_ip', max: 20, windowMs: 60 * 60 * 1000, scope: 'ip' })
  async setup(
    @Body() request: SetupRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.setupFirstUser(request, this.getClientMeta(req));
    this.setAuthCookies(req, res, response.tokens);
    return response;
  }

  @Post('setup/web')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_setup_web_ip', max: 20, windowMs: 60 * 60 * 1000, scope: 'ip' })
  async setupWeb(
    @Body() request: SetupRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const response = await this.authService.setupFirstUser(request, this.getClientMeta(req));
      this.setAuthCookies(req, res, response.tokens);
      if (response.tokens?.accessToken) {
        const payload = Buffer.from(
          JSON.stringify({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken ?? '',
          }),
          'utf8',
        ).toString('base64');
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        return res.send(
          `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Signing in…</title></head><body><script>window.name='bms:${payload}';location.replace('/?auth=1#access=${encodeURIComponent(response.tokens.accessToken)}&refresh=${encodeURIComponent(response.tokens.refreshToken ?? '')}');</script></body></html>`,
        );
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Setup failed.';
      return res.redirect(`/login?setupError=${encodeURIComponent(message)}`);
    }
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'auth_login_ip', max: 50, windowMs: 5 * 60 * 1000, scope: 'ip' },
    { id: 'auth_login_user', max: 10, windowMs: 5 * 60 * 1000, scope: 'ip+username' },
  ])
  async login(
    @Body() request: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(request, this.getClientMeta(req));
    if ((response as { twoFactorRequired?: boolean })?.twoFactorRequired) {
      return res.status(401).json(response);
    }
    this.setAuthCookies(req, res, response.tokens);
    return response;
  }

  @Post('login/web')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'auth_login_web_ip', max: 50, windowMs: 5 * 60 * 1000, scope: 'ip' },
    { id: 'auth_login_web_user', max: 10, windowMs: 5 * 60 * 1000, scope: 'ip+username' },
  ])
  async loginWeb(
    @Body() request: LoginRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.info('auth_login_web_attempt', {
        username: request?.username ?? null,
        hasPassword: Boolean(request?.password),
        hasOtp: Boolean((request as any)?.otp),
      });
      const response = await this.authService.login(request, this.getClientMeta(req));
      if (
        (response as { twoFactorRequired?: boolean; challengeToken?: string })
          ?.twoFactorRequired
      ) {
        this.logger.info('auth_login_web_2fa_required', {
          username: request?.username ?? null,
          challengeIssued: Boolean(
            (response as { challengeToken?: string }).challengeToken,
          ),
        });
        const challengeToken = (response as { challengeToken?: string })
          .challengeToken;
        this.setTwoFactorCookie(req, res, challengeToken);
        const challengeParam = challengeToken
          ? `&challenge=${encodeURIComponent(challengeToken)}`
          : '';
        return res.redirect(`/login?otp=1${challengeParam}`);
      }
      this.logger.info('auth_login_web_success', {
        username: request?.username ?? null,
        hasAccess: Boolean(response.tokens?.accessToken),
        hasRefresh: Boolean(response.tokens?.refreshToken),
      });
      this.setAuthCookies(req, res, response.tokens);
      this.setTwoFactorCookie(req, res);
      if (response.tokens?.accessToken) {
        const access = encodeURIComponent(response.tokens.accessToken);
        const refresh = encodeURIComponent(response.tokens.refreshToken ?? '');
        return res.redirect(
          `/auth/complete?access=${access}&refresh=${refresh}`,
        );
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      this.logger.warn('auth_login_web_error', {
        username: request?.username ?? null,
        message,
      });
      const normalized = message.toLowerCase();
      const otpRequired =
        normalized.includes('two-factor') ||
        normalized.includes('2fa') ||
        normalized.includes('otp');
      const otpParam = otpRequired ? '&otp=1' : '';
      this.setTwoFactorCookie(req, res);
      return res.redirect(
        `/login?error=${encodeURIComponent(message)}${otpParam}`,
      );
    }
  }

  @Post('login/2fa')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_login_2fa_ip', max: 30, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async loginTwoFactor(
    @Body() request: TwoFactorLoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.completeTwoFactorLogin(request, this.getClientMeta(req));
    this.setAuthCookies(req, res, response.tokens);
    this.setTwoFactorCookie(req, res);
    return response;
  }

  @Post('login/2fa/web')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_login_2fa_web_ip', max: 30, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async loginTwoFactorWeb(
    @Body() request: TwoFactorLoginRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.info('auth_login_2fa_attempt', {
        hasOtp: Boolean(request?.otp),
        hasChallenge: Boolean(request?.challengeToken),
      });
      const challengeToken =
        request.challengeToken ?? this.readTwoFactorCookie(req);
      const response = await this.authService.completeTwoFactorLogin({
        otp: request.otp,
        challengeToken,
      }, this.getClientMeta(req));
      this.logger.info('auth_login_2fa_success', {
        hasAccess: Boolean(response.tokens?.accessToken),
        hasRefresh: Boolean(response.tokens?.refreshToken),
      });
      this.setAuthCookies(req, res, response.tokens);
      this.setTwoFactorCookie(req, res);
      if (response.tokens?.accessToken) {
        const access = encodeURIComponent(response.tokens.accessToken);
        const refresh = encodeURIComponent(response.tokens.refreshToken ?? '');
        return res.redirect(
          `/auth/complete?access=${access}&refresh=${refresh}`,
        );
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      this.logger.warn('auth_login_2fa_error', { message });
      this.setTwoFactorCookie(req, res);
      return res.redirect(`/login?error=${encodeURIComponent(message)}&otp=1`);
    }
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_refresh_ip', max: 120, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async refresh(
    @Body() request: RefreshRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    const response = await this.authService.refresh({ refreshToken }, this.getClientMeta(req));
    this.setAuthCookies(req, res, response.tokens);
    return response;
  }

  @Get('complete')
  async completeLogin(
    @Query('access') access: string | undefined,
    @Query('refresh') refresh: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.info('auth_complete', {
      hasAccess: Boolean(access),
      hasRefresh: Boolean(refresh),
    });
    if (!access) {
      return res.redirect('/login?reason=authfail');
    }
    this.setAuthCookies(req, res, { accessToken: access, refreshToken: refresh });
    const safeAccess = encodeURIComponent(access);
    const safeRefresh = encodeURIComponent(refresh ?? '');
    res.setHeader('cache-control', 'no-store');
    return res.redirect(`/?auth=1&access=${safeAccess}&refresh=${safeRefresh}`);
  }

  @Post('debug-log')
  async debugLog(
    @Body() body: { event?: string; meta?: Record<string, unknown> },
  ) {
    this.logger.info('auth_debug', {
      event: body?.event ?? 'unknown',
      meta: body?.meta ?? null,
    });
    return { ok: true };
  }

  @Post('logout')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_logout_ip', max: 120, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async logout(
    @Body() request: LogoutRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    const response = await this.authService.logout({ refreshToken }, this.getClientMeta(req));
    this.clearAuthCookies(req, res);
    return response;
  }

  @Post('password/request')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'auth_pwreq_ip', max: 20, windowMs: 60 * 60 * 1000, scope: 'ip' },
    { id: 'auth_pwreq_email', max: 5, windowMs: 60 * 60 * 1000, scope: 'ip+email' },
  ])
  requestPasswordReset(
    @Body() request: PasswordResetRequest,
    @Req() req: Request,
  ) {
    return this.authService.requestPasswordReset(request, this.getBaseUrl(req));
  }

  @Post('password/reset')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_pwreset_ip', max: 10, windowMs: 60 * 60 * 1000, scope: 'ip' })
  resetPassword(@Body() request: PasswordResetConfirmRequest) {
    return this.authService.resetPassword(request);
  }

  @Get('2fa/status')
  @UseGuards(AuthGuard)
  getTwoFactorStatus(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.getTwoFactorStatus(userId);
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_2fa_setup_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
  async beginTwoFactor(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    const payload = await this.authService.beginTwoFactorSetup(userId);
    const qrDataUrl = await qrcode.toDataURL(payload.otpauthUrl);
    return { ...payload, qrDataUrl };
  }

  @Post('2fa/confirm')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_2fa_confirm_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
  confirmTwoFactor(@Req() req: Request, @Body() body: { code: string }) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.confirmTwoFactorSetup(userId, body?.code ?? '');
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_2fa_disable_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
  disableTwoFactor(
    @Req() req: Request,
    @Body() body: { currentPassword?: string; code?: string },
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.disableTwoFactor(userId, body ?? {});
  }

  @Post('2fa/backup-codes')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'auth_2fa_backup_ip', max: 5, windowMs: 10 * 60 * 1000, scope: 'ip' })
  regenerateBackupCodes(
    @Req() req: Request,
    @Body() body: { currentPassword?: string; code?: string },
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.regenerateBackupCodes(userId, body ?? {});
  }
}
