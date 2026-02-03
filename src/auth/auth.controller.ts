import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
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
  constructor(private readonly authService: AuthService) {}

  private static readonly COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

  private setAuthCookies(res: Response, tokens?: { accessToken?: string; refreshToken?: string }) {
    if (!tokens?.accessToken) {
      return;
    }
    const options = {
      httpOnly: false,
      sameSite: 'lax' as const,
      maxAge: AuthController.COOKIE_MAX_AGE_MS,
      path: '/',
    };
    res.cookie('bmsAccessToken', tokens.accessToken, options);
    if (tokens.refreshToken) {
      res.cookie('bmsRefreshToken', tokens.refreshToken, options);
    }
    res.cookie('bmsLoggedIn', '1', options);
  }

  private setTwoFactorCookie(res: Response, token?: string) {
    const options = {
      httpOnly: false,
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 5,
      path: '/',
    };
    if (token) {
      res.cookie('bmsTwoFactor', token, options);
    } else {
      res.clearCookie('bmsTwoFactor', { path: '/' });
    }
  }

  private readTwoFactorCookie(req: Request) {
    return this.readCookie(req, 'bmsTwoFactor');
  }

  private clearAuthCookies(res: Response) {
    const options = { path: '/' };
    res.clearCookie('bmsAccessToken', options);
    res.clearCookie('bmsRefreshToken', options);
    res.clearCookie('bmsLoggedIn', options);
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
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol ?? 'http';
    const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host');
    if (!host) return undefined;
    return `${proto}://${host}`;
  }

  @Post('signup')
  async signup(@Body() request: SignupRequest, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.signup(request);
    this.setAuthCookies(res, response.tokens);
    return response;
  }

  @Get('setup')
  async setupStatus() {
    return { required: await this.authService.isSetupRequired() };
  }

  @Post('setup')
  async setup(@Body() request: SetupRequest, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.setupFirstUser(request);
    this.setAuthCookies(res, response.tokens);
    return response;
  }

  @Post('setup/web')
  async setupWeb(@Body() request: SetupRequest, @Res() res: Response) {
    try {
      const response = await this.authService.setupFirstUser(request);
      this.setAuthCookies(res, response.tokens);
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
        return res.send(`<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Signing in…</title></head><body><script>window.name='bms:${payload}';location.replace('/?auth=1#access=${encodeURIComponent(response.tokens.accessToken)}&refresh=${encodeURIComponent(response.tokens.refreshToken ?? '')}');</script></body></html>`);
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Setup failed.';
      return res.redirect(`/login?setupError=${encodeURIComponent(message)}`);
    }
  }

  @Post('login')
  async login(@Body() request: LoginRequest, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(request);
    if ((response as { twoFactorRequired?: boolean })?.twoFactorRequired) {
      return res.status(401).json(response);
    }
    this.setAuthCookies(res, response.tokens);
    return response;
  }

  @Post('login/web')
  async loginWeb(@Body() request: LoginRequest, @Res() res: Response) {
    try {
      const response = await this.authService.login(request);
      if ((response as { twoFactorRequired?: boolean; challengeToken?: string })?.twoFactorRequired) {
        const challengeToken = (response as { challengeToken?: string }).challengeToken;
        this.setTwoFactorCookie(res, challengeToken);
        const challengeParam = challengeToken ? `&challenge=${encodeURIComponent(challengeToken)}` : '';
        return res.redirect(`/login?otp=1${challengeParam}`);
      }
      this.setAuthCookies(res, response.tokens);
      this.setTwoFactorCookie(res);
      if (response.tokens?.accessToken) {
        const access = encodeURIComponent(response.tokens.accessToken);
        const refresh = encodeURIComponent(response.tokens.refreshToken ?? '');
        return res.redirect(`/auth/complete?access=${access}&refresh=${refresh}`);
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      const normalized = message.toLowerCase();
      const otpRequired =
        normalized.includes('two-factor') || normalized.includes('2fa') || normalized.includes('otp');
      const otpParam = otpRequired ? '&otp=1' : '';
      this.setTwoFactorCookie(res);
      return res.redirect(`/login?error=${encodeURIComponent(message)}${otpParam}`);
    }
  }

  @Post('login/2fa')
  async loginTwoFactor(@Body() request: TwoFactorLoginRequest, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.completeTwoFactorLogin(request);
    this.setAuthCookies(res, response.tokens);
    this.setTwoFactorCookie(res);
    return response;
  }

  @Post('login/2fa/web')
  async loginTwoFactorWeb(
    @Body() request: TwoFactorLoginRequest,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const challengeToken = request.challengeToken ?? this.readTwoFactorCookie(req);
      const response = await this.authService.completeTwoFactorLogin({
        otp: request.otp,
        challengeToken,
      });
      this.setAuthCookies(res, response.tokens);
      this.setTwoFactorCookie(res);
      if (response.tokens?.accessToken) {
        const access = encodeURIComponent(response.tokens.accessToken);
        const refresh = encodeURIComponent(response.tokens.refreshToken ?? '');
        return res.redirect(`/auth/complete?access=${access}&refresh=${refresh}`);
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      this.setTwoFactorCookie(res);
      return res.redirect(`/login?error=${encodeURIComponent(message)}&otp=1`);
    }
  }

  @Post('refresh')
  async refresh(
    @Body() request: RefreshRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    const response = await this.authService.refresh({ refreshToken });
    this.setAuthCookies(res, response.tokens);
    return response;
  }

  @Get('complete')
  async completeLogin(
    @Query('access') access: string | undefined,
    @Query('refresh') refresh: string | undefined,
    @Res() res: Response,
  ) {
    if (!access) {
      return res.redirect('/login?reason=authfail');
    }
    this.setAuthCookies(res, { accessToken: access, refreshToken: refresh });
    res.setHeader('cache-control', 'no-store');
    return res.redirect('/');
  }

  @Post('logout')
  async logout(
    @Body() request: LogoutRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    const response = await this.authService.logout({ refreshToken });
    this.clearAuthCookies(res);
    return response;
  }

  @Post('password/request')
  requestPasswordReset(@Body() request: PasswordResetRequest, @Req() req: Request) {
    return this.authService.requestPasswordReset(request, this.getBaseUrl(req));
  }

  @Post('password/reset')
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
  async beginTwoFactor(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    const payload = await this.authService.beginTwoFactorSetup(userId);
    const qrDataUrl = await qrcode.toDataURL(payload.otpauthUrl);
    return { ...payload, qrDataUrl };
  }

  @Post('2fa/confirm')
  @UseGuards(AuthGuard)
  confirmTwoFactor(@Req() req: Request, @Body() body: { code: string }) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.confirmTwoFactorSetup(userId, body?.code ?? '');
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  disableTwoFactor(
    @Req() req: Request,
    @Body() body: { currentPassword?: string; code?: string },
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.disableTwoFactor(userId, body ?? {});
  }
}
