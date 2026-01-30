import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthConfigService } from './auth-config.service';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';

@Controller('api/settings/auth')
export class AuthSettingsController {
  constructor(private readonly authConfigService: AuthConfigService) {}

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
  @UseGuards(AuthGuard, AdminGuard)
  async rotate() {
    const config = await this.authConfigService.rotate();
    return {
      configured: Boolean(config.accessSecret && config.refreshSecret),
      updatedAt: config.updatedAt,
    };
  }
}
