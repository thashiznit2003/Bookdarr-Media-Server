import { Body, Controller, Get, Header, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('api/me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Header('cache-control', 'no-store')
  async me(@Req() req: Request) {
    const userId = req?.user?.['userId'];
    return this.authService.getUserById(userId);
  }

  @Put()
  @Header('cache-control', 'no-store')
  async update(@Req() req: Request, @Body() body: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const userId = req?.user?.['userId'];
    return this.authService.updateProfile(userId, body);
  }
}
