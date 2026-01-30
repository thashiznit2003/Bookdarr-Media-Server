import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('api/me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async me(@Req() req: Request) {
    const userId = req?.user?.['userId'];
    return this.authService.getUserById(userId);
  }

  @Put()
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
