import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthService } from './auth.service';
import { FileLoggerService } from '../logging/file-logger.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimit } from './rate-limit.decorator';

@Controller('api/users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: FileLoggerService,
  ) {}

  @Get()
  list() {
    return this.authService.listUsers();
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

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'admin_create_user', max: 10, windowMs: 60_000, scope: 'ip' })
  create(
    @Req() req: Request,
    @Body()
    body: {
      username: string;
      email: string;
      password: string;
      isAdmin?: boolean;
    },
  ) {
    this.logger.info('admin_create_user', {
      byUserId: (req as any).user?.userId ?? null,
      username: body?.username ?? null,
      email: body?.email ?? null,
      isAdmin: Boolean(body?.isAdmin),
    });
    return this.authService.createUser({
      ...body,
      baseUrl: this.getBaseUrl(req),
    });
  }

  @Post(':id/reset-2fa')
  @UseGuards(RateLimitGuard)
  @RateLimit({ id: 'admin_reset_2fa', max: 5, windowMs: 60_000, scope: 'ip' })
  async resetTwoFactor(
    @Req() req: Request,
    @Param('id') id: string,
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
    this.logger.warn('admin_reset_2fa', {
      byUserId: (req as any).user?.userId ?? null,
      targetUserId: id,
    });
    return this.authService.adminResetTwoFactor(id);
  }

  @Post(':id/reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    id: 'admin_reset_password',
    max: 5,
    windowMs: 60_000,
    scope: 'ip',
  })
  async resetPassword(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: { newPassword: string; adminPassword?: string; adminOtp?: string },
  ) {
    await this.authService.assertAdminReauth(
      (req as any).user?.userId,
      { adminPassword: body?.adminPassword, adminOtp: body?.adminOtp },
      {
        ip: req.ip ?? req.socket?.remoteAddress ?? null,
        userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      },
    );
    this.logger.warn('admin_reset_password', {
      byUserId: (req as any).user?.userId ?? null,
      targetUserId: id,
    });
    return this.authService.adminResetPassword(id, body?.newPassword ?? '');
  }
}
