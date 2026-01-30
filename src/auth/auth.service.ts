import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { SettingsService } from '../settings/settings.service';
import { AuthStore } from './auth.store';
import {
  AuthTokens,
  AuthUser,
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SignupRequest,
} from './auth.types';
import { MailerService } from './mailer.service';

const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
  private readonly store = new AuthStore();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async signup(request: SignupRequest) {
    this.assertEmail(request.email);
    this.assertPassword(request.password);
    this.assertInviteCode(request.inviteCode);

    const existing = this.store.findUserByEmail(request.email);
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(request.password, {
      type: argon2.argon2id,
    });

    const user = this.store.createUser({
      email: request.email,
      passwordHash,
    });

    this.store.markInviteCodeUsed(request.inviteCode.trim());

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), tokens };
  }

  async login(request: LoginRequest) {
    this.assertEmail(request.email);
    this.assertPassword(request.password, false);

    const user = this.store.findUserByEmail(request.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const matches = await argon2.verify(user.passwordHash, request.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), tokens };
  }

  async refresh(request: RefreshRequest) {
    if (!request.refreshToken || request.refreshToken.trim().length === 0) {
      throw new BadRequestException('Refresh token is required.');
    }

    const payload = await this.verifyRefreshToken(request.refreshToken);
    const user = this.store.findUserById(payload.sub);

    if (!user || user.refreshTokenId !== payload.jti) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { tokens };
  }

  async logout(request: LogoutRequest) {
    if (!request.refreshToken || request.refreshToken.trim().length === 0) {
      throw new BadRequestException('Refresh token is required.');
    }

    const payload = await this.verifyRefreshToken(request.refreshToken);
    const user = this.store.findUserById(payload.sub);
    if (user) {
      user.refreshTokenId = undefined;
      this.store.updateUser(user);
    }

    return { status: 'ok' };
  }

  async requestPasswordReset(request: PasswordResetRequest) {
    this.assertEmail(request.email);

    const user = this.store.findUserByEmail(request.email);
    if (!user || !user.isActive) {
      return { status: 'ok' };
    }

    const settings = this.settingsService.getSettings();
    const token = this.generateToken();
    const tokenHash = await argon2.hash(token, { type: argon2.argon2id });

    this.store.storeResetToken(token, {
      tokenHash,
      userId: user.id,
      expiresAt:
        Date.now() + settings.auth.resetTokenTtlMinutes * 60 * 1000,
      used: false,
    });

    await this.mailerService.sendPasswordReset(
      user.email,
      token,
      settings.auth.resetTokenTtlMinutes,
    );

    return { status: 'ok' };
  }

  async resetPassword(request: PasswordResetConfirmRequest) {
    if (!request.token || request.token.trim().length === 0) {
      throw new BadRequestException('Reset token is required.');
    }

    this.assertPassword(request.newPassword);

    const record = this.store.getResetToken(request.token);
    if (!record) {
      throw new BadRequestException('Reset token is invalid.');
    }

    if (record.used || Date.now() > record.expiresAt) {
      throw new BadRequestException('Reset token has expired.');
    }

    const matches = await argon2.verify(record.tokenHash, request.token);
    if (!matches) {
      throw new BadRequestException('Reset token is invalid.');
    }

    const user = this.store.findUserById(record.userId);
    if (!user) {
      throw new BadRequestException('Reset token is invalid.');
    }

    user.passwordHash = await argon2.hash(request.newPassword, {
      type: argon2.argon2id,
    });
    user.refreshTokenId = undefined;
    this.store.updateUser(user);
    this.store.markResetTokenUsed(request.token);

    return { status: 'ok' };
  }

  private toAuthUser(user: { id: string; email: string; isActive: boolean; createdAt: string }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const auth = this.getAuthSettings();
    const refreshId = this.generateToken();

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: auth.accessSecret,
        expiresIn: auth.accessTokenTtl,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti: refreshId },
      {
        secret: auth.refreshSecret,
        expiresIn: auth.refreshTokenTtl,
      },
    );

    const user = this.store.findUserById(userId);
    if (user) {
      user.refreshTokenId = refreshId;
      this.store.updateUser(user);
    }

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const auth = this.getAuthSettings();
      return await this.jwtService.verifyAsync<{ sub: string; jti: string }>(
        token,
        {
          secret: auth.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token is invalid.');
    }
  }

  private getAuthSettings() {
    const auth = this.settingsService.getSettings().auth;
    if (!auth.accessSecret || !auth.refreshSecret) {
      throw new ServiceUnavailableException('JWT secrets are not configured.');
    }

    return auth;
  }

  private assertInviteCode(inviteCode: string) {
    if (!inviteCode || inviteCode.trim().length === 0) {
      throw new BadRequestException('Invite code is required.');
    }

    const auth = this.settingsService.getSettings().auth;
    if (auth.inviteCodes.length === 0) {
      throw new ServiceUnavailableException('Invite codes are not configured.');
    }

    const normalized = inviteCode.trim();
    const isValid = auth.inviteCodes.includes(normalized);
    if (!isValid || this.store.isInviteCodeUsed(normalized)) {
      throw new UnauthorizedException('Invite code is invalid.');
    }
  }

  private assertEmail(email: string) {
    if (!email || email.trim().length === 0) {
      throw new BadRequestException('Email is required.');
    }

    const normalized = email.trim().toLowerCase();
    const isValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
    if (!isValid) {
      throw new BadRequestException('Email is invalid.');
    }
  }

  private assertPassword(password: string, checkLength = true) {
    if (!password || password.trim().length === 0) {
      throw new BadRequestException('Password is required.');
    }

    if (checkLength && password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
