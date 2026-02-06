import {
  Body,
  Controller,
  Get,
  Header,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { FileLoggerService } from '../logging/file-logger.service';

@Controller('api/me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: FileLoggerService,
  ) {}

  @Get()
  @Header('cache-control', 'no-store')
  async me(@Req() req: Request) {
    const userId = req?.user?.['userId'];
    this.logger.info('api_me_request', {
      hasUser: Boolean(req?.user),
      userId: userId ?? null,
    });
    try {
      const user = await this.authService.getUserById(userId);
      this.logger.info('api_me_response', {
        ok: Boolean(user),
        userId: user?.id ?? null,
      });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('api_me_error', { message });
      throw error;
    }
  }

  @Put()
  @Header('cache-control', 'no-store')
  async update(
    @Req() req: Request,
    @Body()
    body: {
      username?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const userId = req?.user?.['userId'];
    return this.authService.updateProfile(userId, body);
  }
}
