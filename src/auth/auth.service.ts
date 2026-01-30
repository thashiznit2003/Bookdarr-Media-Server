import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { SettingsService } from '../settings/settings.service';
import {
  AuthTokens,
  AuthUser,
  LoginRequest,
  LogoutRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshRequest,
  SetupRequest,
  SignupRequest,
} from './auth.types';
import { MailerService } from './mailer.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InviteCodeEntity } from './entities/invite-code.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InviteCodeEntity)
    private readonly inviteCodes: Repository<InviteCodeEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly resetTokens: Repository<PasswordResetTokenEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInviteCodes();
  }

  async signup(request: SignupRequest) {
    this.assertEmail(request.email);
    this.assertPassword(request.password);
    await this.assertInviteCode(request.inviteCode);

    const normalizedEmail = request.email.trim().toLowerCase();
    const existing = await this.users.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(request.password, {
      type: argon2.argon2id,
    });

    const user = this.users.create({
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    await this.users.save(user);

    await this.consumeInviteCode(request.inviteCode.trim(), user.id);

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), tokens };
  }

  async setupFirstUser(request: SetupRequest) {
    if (!(await this.isSetupRequired())) {
      throw new BadRequestException('Setup is already complete.');
    }

    const email = this.resolveSetupEmail(request);
    this.assertEmail(email);
    this.assertPassword(request.password);

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(request.password, {
      type: argon2.argon2id,
    });

    const user = this.users.create({
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    await this.users.save(user);

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.toAuthUser(user), tokens };
  }

  async login(request: LoginRequest) {
    this.assertEmail(request.email);
    this.assertPassword(request.password, false);

    const normalizedEmail = request.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalizedEmail } });
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
    const user = await this.users.findOne({ where: { id: payload.sub } });

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
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (user) {
      user.refreshTokenId = undefined;
      await this.users.save(user);
    }

    return { status: 'ok' };
  }

  async requestPasswordReset(request: PasswordResetRequest) {
    this.assertEmail(request.email);

    const normalizedEmail = request.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      return { status: 'ok' };
    }

    const settings = this.settingsService.getSettings();
    const { token, tokenId, secretHash } = await this.generateResetToken();
    const resetToken = this.resetTokens.create({
      id: tokenId,
      secretHash,
      userId: user.id,
      expiresAt: Date.now() + settings.auth.resetTokenTtlMinutes * 60 * 1000,
      createdAt: new Date().toISOString(),
    });
    await this.resetTokens.save(resetToken);

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

    const { tokenId, secret } = this.parseResetToken(request.token);
    const record = await this.resetTokens.findOne({ where: { id: tokenId } });
    if (!record) {
      throw new BadRequestException('Reset token is invalid.');
    }

    if (record.usedAt || Date.now() > Number(record.expiresAt)) {
      throw new BadRequestException('Reset token has expired.');
    }

    const matches = await argon2.verify(record.secretHash, secret);
    if (!matches) {
      throw new BadRequestException('Reset token is invalid.');
    }

    const user = await this.users.findOne({ where: { id: record.userId } });
    if (!user) {
      throw new BadRequestException('Reset token is invalid.');
    }

    user.passwordHash = await argon2.hash(request.newPassword, {
      type: argon2.argon2id,
    });
    user.refreshTokenId = undefined;
    await this.users.save(user);
    record.usedAt = new Date().toISOString();
    await this.resetTokens.save(record);

    return { status: 'ok' };
  }

  async isSetupRequired(): Promise<boolean> {
    const total = await this.users.count();
    return total === 0;
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
        expiresIn: auth.accessTokenTtl as StringValue,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti: refreshId },
      {
        secret: auth.refreshSecret,
        expiresIn: auth.refreshTokenTtl as StringValue,
      },
    );

    const user = await this.users.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenId = refreshId;
      await this.users.save(user);
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

  private async assertInviteCode(inviteCode: string) {
    if (!inviteCode || inviteCode.trim().length === 0) {
      throw new BadRequestException('Invite code is required.');
    }

    const totalInviteCodes = await this.inviteCodes.count();
    if (totalInviteCodes === 0) {
      throw new ServiceUnavailableException('Invite codes are not configured.');
    }

    const normalized = inviteCode.trim();
    const code = await this.inviteCodes.findOne({ where: { code: normalized } });
    if (!code || code.usedAt) {
      throw new UnauthorizedException('Invite code is invalid.');
    }
  }

  private assertEmail(email: string) {
    if (!email || email.trim().length === 0) {
      throw new BadRequestException('Email is required.');
    }

    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254) {
      throw new BadRequestException('Email is invalid.');
    }

    const atIndex = normalized.indexOf('@');
    const dotIndex = normalized.lastIndexOf('.');
    const hasValidStructure =
      atIndex > 0 &&
      dotIndex > atIndex + 1 &&
      dotIndex < normalized.length - 1 &&
      normalized.indexOf(' ') === -1;

    if (!hasValidStructure) {
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

  private resolveSetupEmail(request: SetupRequest): string {
    const email = request.email?.trim();
    if (email && email.length > 0) {
      return email.toLowerCase();
    }

    const username = request.username?.trim();
    if (username && username.length > 0) {
      return username.toLowerCase();
    }

    throw new BadRequestException('Email or username is required.');
  }

  private async seedInviteCodes() {
    const codes = this.settingsService.getSettings().auth.inviteCodes;
    if (codes.length === 0) {
      return;
    }

    for (const code of codes) {
      const normalized = code.trim();
      if (normalized.length === 0) {
        continue;
      }
      const existing = await this.inviteCodes.findOne({
        where: { code: normalized },
      });
      if (!existing) {
        const invite = this.inviteCodes.create({
          code: normalized,
          createdAt: new Date().toISOString(),
        });
        await this.inviteCodes.save(invite);
      }
    }
  }

  private async consumeInviteCode(code: string, userId: string) {
    const record = await this.inviteCodes.findOne({ where: { code } });
    if (!record || record.usedAt) {
      throw new UnauthorizedException('Invite code is invalid.');
    }

    record.usedAt = new Date().toISOString();
    record.usedByUserId = userId;
    await this.inviteCodes.save(record);
  }

  private async generateResetToken() {
    const tokenId = this.generateToken();
    const secret = this.generateToken();
    const secretHash = await argon2.hash(secret, { type: argon2.argon2id });
    return { token: `${tokenId}.${secret}`, tokenId, secretHash };
  }

  private parseResetToken(token: string) {
    const [tokenId, secret] = token.split('.');
    if (!tokenId || !secret) {
      throw new BadRequestException('Reset token is invalid.');
    }
    return { tokenId, secret };
  }
}
