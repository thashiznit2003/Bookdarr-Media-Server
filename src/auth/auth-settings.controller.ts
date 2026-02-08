import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthConfigService } from './auth-config.service';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimit } from './rate-limit.decorator';

@Controller('api/settings/auth')
export class AuthSettingsController {
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async status() {
    const config = await this.authConfigService.ensureConfigured();
    const configured = Boolean(config?.accessSecret && config?.refreshSecret);
    return {
      configured,
      updatedAt: config?.updatedAt ?? null,
    };
  }

  @Post('rotate')
  @UseGuards(AuthGuard, AdminGuard, RateLimitGuard)
  @RateLimit({ id: 'auth_rotate_secrets', max: 3, windowMs: 60 * 60 * 1000, scope: 'ip' })
  async rotate(
    @Req() req: Request,
    @Body() body: { adminPassword?: string; adminOtp?: string },
  ) {
    await this.authService.assertAdminReauth(
      (req as any).user?.userId,
      { adminPassword: body?.adminPassword, adminOtp: body?.adminOtp },
      {
        ip: req.ip ?? req.socket?.remoteAddress ?? null,
        userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      },
    );
    const config = await this.authConfigService.rotate();
    return {
      configured: Boolean(config.accessSecret && config.refreshSecret),
      updatedAt: config.updatedAt,
    };
  }
}
