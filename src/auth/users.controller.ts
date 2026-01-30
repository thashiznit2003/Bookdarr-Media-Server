import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Post()
  create(@Body() body: { username: string; email: string; password: string; isAdmin?: boolean }) {
    return this.authService.createUser(body);
  }
}
