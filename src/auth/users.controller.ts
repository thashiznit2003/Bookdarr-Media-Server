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

@Controller('api/users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

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
    return this.authService.createUser({
      ...body,
      baseUrl: this.getBaseUrl(req),
    });
  }

  @Post(':id/reset-2fa')
  resetTwoFactor(@Param('id') id: string) {
    return this.authService.adminResetTwoFactor(id);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.authService.adminResetPassword(id, body?.newPassword ?? '');
  }
}
