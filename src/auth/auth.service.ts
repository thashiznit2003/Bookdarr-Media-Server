import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { generateSecret, generateURI, verify } from 'otplib';
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
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InviteCodeEntity } from './entities/invite-code.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { AuthConfigService } from './auth-config.service';

const MIN_PASSWORD_LENGTH = 8;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly authConfigService: AuthConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InviteCodeEntity)
    private readonly inviteCodes: Repository<InviteCodeEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly resetTokens: Repository<PasswordResetTokenEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInviteCodes();
    await this.ensureUsernames();
    await this.ensureAdminUser();
  }

  async signup(request: SignupRequest) {
    const username = this.normalizeUsername(request.username);
    const email = this.normalizeEmail(request.email);

    this.assertUsername(username);
    this.assertEmail(email);
    this.assertPassword(request.password);
    await this.assertInviteCode(request.inviteCode);

    const existing = await this.users.findOne({
      where: [{ username }, { email }],
    });
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(request.password, {
      type: argon2.argon2id,
    });

    const user = this.users.create({
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
      isAdmin: false,
    });
    await this.users.save(user);

    await this.consumeInviteCode(request.inviteCode.trim(), user.id);

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), tokens };
  }

  async setupFirstUser(request: SetupRequest) {
    if (!(await this.isSetupRequired())) {
      throw new BadRequestException('Setup is already complete.');
    }

    const username = this.normalizeUsername(request.username);
    const email = this.normalizeEmail(request.email);
    this.assertUsername(username);
    this.assertEmail(email);
    this.assertPassword(request.password);

    const existing = await this.users.findOne({
      where: [{ username }, { email }],
    });
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(request.password, {
      type: argon2.argon2id,
    });

    const user = this.users.create({
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
      isAdmin: true,
    });
    await this.users.save(user);

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), tokens };
  }

  async login(request: LoginRequest) {
    const identifier = request.username?.trim();
    if (!identifier) {
      throw new BadRequestException('Username is required.');
    }

    this.assertPassword(request.password, false);

    let user: UserEntity | null = null;
    if (identifier.includes('@')) {
      const email = this.normalizeEmail(identifier);
      this.assertEmail(email);
      user = await this.users.findOne({ where: { email } });
    } else {
      const username = this.normalizeUsername(identifier);
      this.assertUsername(username);
      user = await this.users.findOne({ where: { username } });
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const matches = await argon2.verify(user.passwordHash, request.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.twoFactorEnabled) {
      const otp = request.otp?.trim();
      if (!otp) {
        return {
          twoFactorRequired: true,
          challengeToken: await this.issueTwoFactorChallenge(user),
        };
      }
      const secret = user.twoFactorSecret ?? '';
      const isValid = secret ? verify({ token: otp, secret }) : false;
      if (!isValid) {
        throw new UnauthorizedException({
          message: 'Invalid two-factor code.',
          twoFactorRequired: true,
        });
      }
    }

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), tokens };
  }

  async completeTwoFactorLogin(input: { otp?: string; challengeToken?: string }) {
    const otp = input.otp?.trim();
    if (!otp) {
      throw new BadRequestException('Two-factor code is required.');
    }
    const challengeToken = input.challengeToken?.trim();
    if (!challengeToken) {
      throw new BadRequestException('Two-factor challenge is required.');
    }

    const userId = await this.verifyTwoFactorChallenge(challengeToken);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor challenge is invalid.');
    }
    const secret = user.twoFactorSecret ?? '';
    const isValid = secret ? verify({ token: otp, secret }) : false;
    if (!isValid) {
      throw new UnauthorizedException('Invalid two-factor code.');
    }

    const tokens = await this.issueTokens(user);
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

    const tokens = await this.issueTokens(user);
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

  async listUsers() {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.toAuthUser(user));
  }

  async createUser(input: { username: string; email: string; password: string; isAdmin?: boolean; baseUrl?: string }) {
    const username = this.normalizeUsername(input.username);
    const email = this.normalizeEmail(input.email);

    this.assertUsername(username);
    this.assertEmail(email);
    this.assertPassword(input.password);

    const existing = await this.users.findOne({ where: [{ username }, { email }] });
    if (existing) {
      throw new BadRequestException('User already exists.');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    const user = this.users.create({
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
      isAdmin: Boolean(input.isAdmin),
    });

    await this.users.save(user);
    await this.mailerService.sendNewUserWelcome(user.email, user.username ?? '', input.baseUrl);
    return this.toAuthUser(user);
  }

  async getUserById(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }
    return this.toAuthUser(user);
  }

  async updateProfile(
    userId: string | undefined,
    input: { username?: string; email?: string; currentPassword?: string; newPassword?: string },
  ) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }

    if (input.username) {
      const username = this.normalizeUsername(input.username);
      this.assertUsername(username);
      const existing = await this.users.findOne({ where: { username } });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Username is already in use.');
      }
      user.username = username;
    }

    if (input.email) {
      const email = this.normalizeEmail(input.email);
      this.assertEmail(email);
      const existing = await this.users.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Email is already in use.');
      }
      user.email = email;
    }

    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestException('Current password is required.');
      }
      const matches = await argon2.verify(user.passwordHash, input.currentPassword);
      if (!matches) {
        throw new UnauthorizedException('Current password is invalid.');
      }
      this.assertPassword(input.newPassword);
      user.passwordHash = await argon2.hash(input.newPassword, {
        type: argon2.argon2id,
      });
    }

    await this.users.save(user);
    return this.toAuthUser(user);
  }

  async requestPasswordReset(request: PasswordResetRequest, baseUrl?: string) {
    const email = this.normalizeEmail(request.email);
    this.assertEmail(email);

    const user = await this.users.findOne({ where: { email } });
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
      baseUrl,
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

  async getTwoFactorStatus(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }
    return { enabled: Boolean(user.twoFactorEnabled) };
  }

  async beginTwoFactorSetup(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const secret = generateSecret();
    user.twoFactorTempSecret = secret;
    await this.users.save(user);
    const label = user.username ?? user.email;
    const issuer = 'Bookdarr Media Server';
    const otpauthUrl = generateURI({ issuer, label, secret });
    return { secret, otpauthUrl, issuer };
  }

  async confirmTwoFactorSetup(userId: string | undefined, code: string) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const secret = user.twoFactorTempSecret ?? '';
    const isValid = secret ? verify({ token: code, secret }) : false;
    if (!isValid) {
      throw new BadRequestException('Invalid two-factor code.');
    }
    user.twoFactorSecret = secret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    await this.users.save(user);
    return { enabled: true };
  }

  async disableTwoFactor(
    userId: string | undefined,
    input: { currentPassword?: string; code?: string },
  ) {
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized.');
    }
    if (!user.twoFactorEnabled) {
      return { enabled: false };
    }
    if (input.code) {
      const secret = user.twoFactorSecret ?? '';
      const isValid = secret ? verify({ token: input.code.trim(), secret }) : false;
      if (!isValid) {
        throw new BadRequestException('Invalid two-factor code.');
      }
    } else if (input.currentPassword) {
      const matches = await argon2.verify(user.passwordHash, input.currentPassword);
      if (!matches) {
        throw new UnauthorizedException('Current password is invalid.');
      }
    } else {
      throw new BadRequestException('Two-factor code or current password is required.');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    await this.users.save(user);
    return { enabled: false };
  }

  async isSetupRequired(): Promise<boolean> {
    const total = await this.users.count();
    return total === 0;
  }

  private toAuthUser(user: UserEntity): AuthUser {
    return {
      id: user.id,
      username: user.username ?? '',
      email: user.email,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      createdAt: user.createdAt,
    };
  }

  private async issueTwoFactorChallenge(user: UserEntity): Promise<string> {
    const secrets = await this.authConfigService.getSecrets();
    const secret = secrets.accessSecret?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('Auth secrets are not configured.');
    }
    const jti = randomBytes(16).toString('hex');
    return this.jwtService.signAsync(
      { sub: user.id, jti, type: 'twoFactor' },
      { secret, expiresIn: '5m' },
    );
  }

  private async verifyTwoFactorChallenge(token: string): Promise<string> {
    const secrets = await this.authConfigService.getSecrets();
    const secret = secrets.accessSecret?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('Auth secrets are not configured.');
    }
    const payload = await this.jwtService.verifyAsync(token, { secret });
    if (!payload || payload.type !== 'twoFactor' || !payload.sub) {
      throw new UnauthorizedException('Two-factor challenge is invalid.');
    }
    return payload.sub;
  }

  private async issueTokens(user: UserEntity): Promise<AuthTokens> {
    const auth = await this.getAuthSettings();
    const refreshId = this.generateToken();

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin },
      {
        secret: auth.accessSecret,
        expiresIn: auth.accessTokenTtl as StringValue,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti: refreshId },
      {
        secret: auth.refreshSecret,
        expiresIn: auth.refreshTokenTtl as StringValue,
      },
    );

    user.refreshTokenId = refreshId;
    await this.users.save(user);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const auth = await this.getAuthSettings();
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

  private async getAuthSettings() {
    const auth = this.settingsService.getSettings().auth;
    const secrets = await this.authConfigService.getSecrets();
    const accessSecret = secrets.accessSecret ?? auth.accessSecret;
    const refreshSecret = secrets.refreshSecret ?? auth.refreshSecret;

    if (!accessSecret || !refreshSecret) {
      throw new ServiceUnavailableException('JWT secrets are not configured.');
    }

    return {
      ...auth,
      accessSecret,
      refreshSecret,
    };
  }

  async getAuthSecrets() {
    const auth = this.settingsService.getSettings().auth;
    const secrets = await this.authConfigService.getSecrets();
    return {
      accessSecret: secrets.accessSecret ?? auth.accessSecret,
      refreshSecret: secrets.refreshSecret ?? auth.refreshSecret,
    };
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

  private normalizeEmail(email: string | undefined) {
    return (email ?? '').trim().toLowerCase();
  }

  private normalizeUsername(username: string | undefined) {
    return (username ?? '').trim().toLowerCase();
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

  private assertUsername(username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required.');
    }

    const normalized = username.trim();
    if (normalized.length < MIN_USERNAME_LENGTH || normalized.length > MAX_USERNAME_LENGTH) {
      throw new BadRequestException(
        `Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters.`,
      );
    }

    if (normalized.includes('@')) {
      throw new BadRequestException('Username cannot be an email address.');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
      throw new BadRequestException(
        'Username can only include letters, numbers, dots, underscores, and dashes.',
      );
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

  private async ensureUsernames() {
    const users = await this.users.find({ where: { username: IsNull() } });
    for (const user of users) {
      const emailPrefix = user.email?.split('@')[0] ?? 'user';
      let base = emailPrefix.toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (!base) {
        base = 'user';
      }

      let candidate = base;
      for (let i = 0; i < 20; i++) {
        const existing = await this.users.findOne({ where: { username: candidate } });
        if (!existing) {
          user.username = candidate;
          await this.users.save(user);
          break;
        }
        candidate = `${base}${i + 1}`;
      }
    }
  }

  private async ensureAdminUser() {
    const adminCount = await this.users.count({ where: { isAdmin: true } });
    if (adminCount > 0) {
      return;
    }

    const users = await this.users.find({ order: { createdAt: 'ASC' } });
    if (users.length === 0) {
      return;
    }

    users[0].isAdmin = true;
    await this.users.save(users[0]);
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
