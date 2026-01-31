import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SetupRequest,
  SignupRequest,
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
        const refresh = response.tokens.refreshToken ?? '';
        return res.redirect(
          `/#access=${encodeURIComponent(response.tokens.accessToken)}&refresh=${encodeURIComponent(refresh)}`,
        );
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
    this.setAuthCookies(res, response.tokens);
    return response;
  }

  @Post('login/web')
  async loginWeb(@Body() request: LoginRequest, @Res() res: Response) {
    try {
      const response = await this.authService.login(request);
      this.setAuthCookies(res, response.tokens);
      if (response.tokens?.accessToken) {
        const refresh = response.tokens.refreshToken ?? '';
        return res.redirect(
          `/#access=${encodeURIComponent(response.tokens.accessToken)}&refresh=${encodeURIComponent(refresh)}`,
        );
      }
      return res.redirect('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      return res.redirect(`/login?error=${encodeURIComponent(message)}`);
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
  requestPasswordReset(@Body() request: PasswordResetRequest) {
    return this.authService.requestPasswordReset(request);
  }

  @Post('password/reset')
  resetPassword(@Body() request: PasswordResetConfirmRequest) {
    return this.authService.resetPassword(request);
  }
}
