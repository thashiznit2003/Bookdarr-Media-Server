import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthConfigService } from './auth-config.service';
import { AuthService } from './auth.service';

@Controller('api/settings/auth')
export class AuthSettingsController {
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async status() {
    const configured = await this.authConfigService.isConfigured();
    return {
      accessSecretConfigured: configured,
      refreshSecretConfigured: configured,
    };
  }

  @Post()
  async update(@Body() body: { accessSecret?: string; refreshSecret?: string }, @Req() req: Request) {
    const secrets = await this.authService.getAuthSecrets();
    const configured = Boolean(secrets.accessSecret && secrets.refreshSecret);

    if (configured) {
      const authHeader = req.headers.authorization ?? '';
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('Authorization required.');
      }

      if (!secrets.accessSecret) {
        throw new UnauthorizedException('JWT secret is not configured.');
      }

      const payload = await this.jwtService.verifyAsync<{ isAdmin?: boolean }>(token, {
        secret: secrets.accessSecret,
      });

      if (!payload?.isAdmin) {
        throw new UnauthorizedException('Admin access required.');
      }
    }

    const config = await this.authConfigService.upsert({
      accessSecret: body.accessSecret,
      refreshSecret: body.refreshSecret,
    });

    return {
      accessSecretConfigured: Boolean(config.accessSecret),
      refreshSecretConfigured: Boolean(config.refreshSecret),
      updatedAt: config.updatedAt,
    };
  }
}
