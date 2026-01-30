import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SignupRequest,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() request: SignupRequest) {
    return this.authService.signup(request);
  }

  @Post('login')
  login(@Body() request: LoginRequest) {
    return this.authService.login(request);
  }

  @Post('refresh')
  refresh(@Body() request: RefreshRequest) {
    return this.authService.refresh(request);
  }

  @Post('logout')
  logout(@Body() request: LogoutRequest) {
    return this.authService.logout(request);
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
