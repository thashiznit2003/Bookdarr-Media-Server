import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
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
  TwoFactorLoginRequest,
} from './auth.types';

@Controller('api/v1/auth')
export class ApiV1AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'api_v1_auth_login_ip', max: 50, windowMs: 5 * 60 * 1000, scope: 'ip' },
    { id: 'api_v1_auth_login_user', max: 10, windowMs: 5 * 60 * 1000, scope: 'ip+username' },
  ])
  async login(@Body() request: LoginRequest, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(request);
    if ((response as { twoFactorRequired?: boolean })?.twoFactorRequired) {
      return res.status(401).json(response);
    }
    return response;
  }

  @Post('login/2fa')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_login_2fa_ip', max: 30, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async loginTwoFactor(@Body() request: TwoFactorLoginRequest) {
    return this.authService.completeTwoFactorLogin(request);
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_refresh_ip', max: 120, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async refresh(@Body() request: RefreshRequest, @Req() req: Request) {
    // Support both explicit token and cookie-based refresh (useful for in-app webviews).
    const refreshToken = request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    return this.authService.refresh({ refreshToken });
  }

  @Post('logout')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_logout_ip', max: 120, windowMs: 5 * 60 * 1000, scope: 'ip' })
  async logout(@Body() request: LogoutRequest, @Req() req: Request) {
    const refreshToken = request.refreshToken ?? this.readCookie(req, 'bmsRefreshToken');
    return this.authService.logout({ refreshToken });
  }

  @Post('password/request')
  @UseGuards(RateLimitGuard)
  @RateLimit([
    { id: 'api_v1_auth_pwreq_ip', max: 20, windowMs: 60 * 60 * 1000, scope: 'ip' },
    { id: 'api_v1_auth_pwreq_email', max: 5, windowMs: 60 * 60 * 1000, scope: 'ip+email' },
  ])
  requestPasswordReset(@Body() request: PasswordResetRequest, @Req() req: Request) {
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined) ??
      req.protocol ??
      'http';
    const host =
      (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host');
    const baseUrl = host ? `${proto}://${host}` : undefined;
    return this.authService.requestPasswordReset(request, baseUrl);
  }

  @Post('password/reset')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_pwreset_ip', max: 10, windowMs: 60 * 60 * 1000, scope: 'ip' })
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
  @RateLimit({ id: 'api_v1_auth_2fa_setup_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
  async beginTwoFactor(@Req() req: Request) {
    const userId = (req as any).user?.userId as string | undefined;
    const payload = await this.authService.beginTwoFactorSetup(userId);
    const qrDataUrl = await qrcode.toDataURL(payload.otpauthUrl);
    return { ...payload, qrDataUrl };
  }

  @Post('2fa/confirm')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_2fa_confirm_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
  confirmTwoFactor(@Req() req: Request, @Body() body: { code: string }) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.confirmTwoFactorSetup(userId, body?.code ?? '');
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'api_v1_auth_2fa_disable_ip', max: 10, windowMs: 10 * 60 * 1000, scope: 'ip' })
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
  @RateLimit({ id: 'api_v1_auth_2fa_backup_ip', max: 5, windowMs: 10 * 60 * 1000, scope: 'ip' })
  regenerateBackupCodes(
    @Req() req: Request,
    @Body() body: { currentPassword?: string; code?: string },
  ) {
    const userId = (req as any).user?.userId as string | undefined;
    return this.authService.regenerateBackupCodes(userId, body ?? {});
  }
}
