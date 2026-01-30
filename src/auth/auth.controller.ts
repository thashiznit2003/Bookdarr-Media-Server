import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SetupRequest,
  SignupRequest,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() request: SignupRequest) {
    return this.authService.signup(request);
  }

  @Get('setup')
  async setupStatus() {
    return { required: await this.authService.isSetupRequired() };
  }

  @Post('setup')
  setup(@Body() request: SetupRequest) {
    return this.authService.setupFirstUser(request);
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
