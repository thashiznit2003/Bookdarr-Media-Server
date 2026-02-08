import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
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
import { TwoFactorBackupCodeEntity } from './entities/two-factor-backup-code.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { FileLoggerService } from '../logging/file-logger.service';
import {
  buildOtpauthUrl,
  generateTotpSecret,
  verifyTotpCode,
} from './totp';

const MIN_PASSWORD_LENGTH = 8;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;

type ClientMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly authConfigService: AuthConfigService,
    private readonly logger: FileLoggerService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(InviteCodeEntity)
    private readonly inviteCodes: Repository<InviteCodeEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly resetTokens: Repository<PasswordResetTokenEntity>,
    @InjectRepository(TwoFactorBackupCodeEntity)
    private readonly backupCodes: Repository<TwoFactorBackupCodeEntity>,
    @InjectRepository(AuthSessionEntity)
    private readonly sessions: Repository<AuthSessionEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInviteCodes();
    await this.ensureUsernames();
    await this.ensureAdminUser();
  }

  async signup(request: SignupRequest, meta?: ClientMeta) {
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

    const tokens = await this.issueTokens(user, meta);
    return { user: this.toAuthUser(user), tokens };
  }

  async setupFirstUser(request: SetupRequest, meta?: ClientMeta) {
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

    const tokens = await this.issueTokens(user, meta);
    return { user: this.toAuthUser(user), tokens };
  }

  async login(request: LoginRequest, meta?: ClientMeta) {
    const identifier = request.username?.trim();
    if (!identifier) {
      throw new BadRequestException('Username is required.');
    }

    this.logger.info('auth_login_attempt', {
      identifier: this.safeIdentifierForLogs(identifier),
      hasOtp: Boolean(request.otp?.trim()),
      ip: meta?.ip ?? null,
    });

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
      this.logger.warn('auth_login_failed', {
        identifier: this.safeIdentifierForLogs(identifier),
        reason: 'invalid_credentials',
        ip: meta?.ip ?? null,
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const matches = await argon2.verify(user.passwordHash, request.password);
    if (!matches) {
      this.logger.warn('auth_login_failed', {
        identifier: this.safeIdentifierForLogs(identifier),
        userId: user.id,
        reason: 'invalid_credentials',
        ip: meta?.ip ?? null,
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.twoFactorEnabled) {
      const otp = request.otp?.trim();
      if (!otp) {
        this.logger.info('auth_login_2fa_required', {
          userId: user.id,
          identifier: this.safeIdentifierForLogs(identifier),
        });
        return {
          twoFactorRequired: true,
          challengeToken: await this.issueTwoFactorChallenge(user),
        };
      }
      const secret = await this.resolveTwoFactorSecret(user.twoFactorSecret);
      let isValid = secret ? verifyTotpCode({ token: otp, secret }) : false;
      if (!isValid) {
        isValid = await this.tryConsumeBackupCode(user.id, otp);
      }
      if (!isValid) {
        this.logger.warn('auth_login_failed', {
          userId: user.id,
          identifier: this.safeIdentifierForLogs(identifier),
          reason: 'invalid_two_factor',
          ip: meta?.ip ?? null,
        });
        throw new UnauthorizedException({
          message: 'Invalid two-factor code.',
          twoFactorRequired: true,
        });
      }
      await this.maybeUpgradeTwoFactorSecret(user, secret);
    }

    const tokens = await this.issueTokens(user, meta);
    this.logger.info('auth_login_success', {
      userId: user.id,
      username: user.username ?? null,
      isAdmin: Boolean(user.isAdmin),
      ip: meta?.ip ?? null,
    });
    return { user: this.toAuthUser(user), tokens };
  }

  async completeTwoFactorLogin(input: {
    otp?: string;
    challengeToken?: string;
  }, meta?: ClientMeta) {
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
      this.logger.warn('auth_login_2fa_failed', {
        reason: 'invalid_challenge',
        ip: meta?.ip ?? null,
      });
      throw new UnauthorizedException('Two-factor challenge is invalid.');
    }
    const secret = await this.resolveTwoFactorSecret(user.twoFactorSecret);
    let isValid = secret ? verifyTotpCode({ token: otp, secret }) : false;
    if (!isValid) {
      isValid = await this.tryConsumeBackupCode(user.id, otp);
    }
    if (!isValid) {
      this.logger.warn('auth_login_2fa_failed', {
        userId: user.id,
        reason: 'invalid_code',
        ip: meta?.ip ?? null,
      });
      throw new UnauthorizedException('Invalid two-factor code.');
    }
    await this.maybeUpgradeTwoFactorSecret(user, secret);

    const tokens = await this.issueTokens(user, meta);
    this.logger.info('auth_login_2fa_success', {
      userId: user.id,
      ip: meta?.ip ?? null,
    });
    return { user: this.toAuthUser(user), tokens };
  }

  async refresh(request: RefreshRequest, meta?: ClientMeta) {
    if (!request.refreshToken || request.refreshToken.trim().length === 0) {
      throw new BadRequestException('Refresh token is required.');
    }

    const payload = await this.verifyRefreshToken(request.refreshToken);
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }
    const tv = typeof payload.tv === 'number' ? payload.tv : undefined;
    if (typeof tv === 'number' && (user.tokenVersion ?? 0) !== tv) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    // Session-based refresh tokens (multi-device).
    if (payload.sid) {
      const session = await this.sessions.findOne({
        where: { id: payload.sid, userId: user.id },
      });
      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Refresh token is invalid.');
      }
      if (session.refreshTokenId !== payload.jti) {
        await this.revokeAllSessionsForUser(
          user.id,
          'refresh_token_reuse_detected',
        );
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
        user.refreshTokenId = undefined;
        await this.users.save(user);
        throw new UnauthorizedException('Refresh token is invalid.');
      }

      const tokens = await this.issueTokensForExistingSession(user, session, meta);
      this.logger.info('auth_refresh_success', {
        userId: user.id,
        sid: session.id,
        ip: meta?.ip ?? null,
      });
      return { tokens };
    }

    // Legacy refresh tokens (single refreshTokenId on user). Accept once, then migrate to a session.
    if (user.refreshTokenId !== payload.jti) {
      user.refreshTokenId = undefined;
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await this.users.save(user);
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    // Migrate: create a session and rotate to a session-based refresh token.
    const session = await this.createSession(user.id, meta);
    const tokens = await this.issueTokensForExistingSession(user, session, meta);
    user.refreshTokenId = undefined;
    await this.users.save(user);
    this.logger.info('auth_refresh_success', {
      userId: user.id,
      sid: session.id,
      ip: meta?.ip ?? null,
      migrated: true,
    });
    return { tokens };
  }

  // Used by server-rendered bootstrap to decide whether to serve the app shell or
  // redirect to /login. This must mirror the JWT strategy validation, including
  // per-user tokenVersion and per-session revocation checks.
  async verifyAccessTokenForBootstrap(accessToken: string): Promise<AuthUser | null> {
    if (!accessToken || accessToken.trim().length === 0) {
      return null;
    }
    try {
      const auth = await this.getAuthSettings();
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tv?: number;
        sid?: string;
      }>(accessToken, { secret: auth.accessSecret });

      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        return null;
      }
      const tv = typeof payload.tv === 'number' ? payload.tv : 0;
      if ((user.tokenVersion ?? 0) !== tv) {
        return null;
      }
      if (payload.sid) {
        const session = await this.sessions.findOne({
          where: { id: payload.sid, userId: user.id, revokedAt: IsNull() },
        });
        if (!session) {
          return null;
        }
      }
      return this.toAuthUser(user);
    } catch {
      return null;
    }
  }

  async logout(request: LogoutRequest, meta?: ClientMeta) {
    if (!request.refreshToken || request.refreshToken.trim().length === 0) {
      throw new BadRequestException('Refresh token is required.');
    }

    const payload = await this.verifyRefreshToken(request.refreshToken);
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return { status: 'ok' };
    }

    if (payload.sid) {
      const session = await this.sessions.findOne({
        where: { id: payload.sid, userId: user.id },
      });
      if (session && !session.revokedAt && session.refreshTokenId === payload.jti) {
        session.revokedAt = new Date().toISOString();
        session.revokeReason = 'logout';
        session.refreshTokenId = null;
        session.lastUsedAt = new Date().toISOString();
        session.lastIp = meta?.ip ?? session.lastIp ?? null;
        await this.sessions.save(session);
      }
      this.logger.info('auth_logout', {
        userId: user.id,
        sid: payload.sid,
        ip: meta?.ip ?? null,
      });
      return { status: 'ok' };
    }

    // Legacy logout token: clear the single refresh token and migrate sessions by revoking all existing.
    if (user.refreshTokenId === payload.jti) {
      user.refreshTokenId = undefined;
      await this.users.save(user);
    }
    await this.revokeAllSessionsForUser(user.id, 'legacy_logout');

    this.logger.info('auth_logout', {
      userId: user.id,
      sid: null,
      ip: meta?.ip ?? null,
      legacy: true,
    });
    return { status: 'ok' };
  }

  async listUsers() {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.toAuthUser(user));
  }

  async createUser(input: {
    username: string;
    email: string;
    password: string;
    isAdmin?: boolean;
    baseUrl?: string;
  }) {
    const username = this.normalizeUsername(input.username);
    const email = this.normalizeEmail(input.email);

    this.assertUsername(username);
    this.assertEmail(email);
    this.assertPassword(input.password);

    const existing = await this.users.findOne({
      where: [{ username }, { email }],
    });
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
    await this.mailerService.sendNewUserWelcome(
      user.email,
      user.username ?? '',
      input.baseUrl,
    );
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
    input: {
      username?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
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
      const matches = await argon2.verify(
        user.passwordHash,
        input.currentPassword,
      );
      if (!matches) {
        throw new UnauthorizedException('Current password is invalid.');
      }
      this.assertPassword(input.newPassword);
      user.passwordHash = await argon2.hash(input.newPassword, {
        type: argon2.argon2id,
      });
      // Password change revokes refresh tokens and invalidates existing access tokens.
      user.refreshTokenId = undefined;
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    }

    await this.users.save(user);
    if (input.newPassword) {
      await this.revokeAllSessionsForUser(user.id, 'password_change');
    }
    return this.toAuthUser(user);
  }

  async requestPasswordReset(request: PasswordResetRequest, baseUrl?: string) {
    const email = this.normalizeEmail(request.email);
    this.assertEmail(email);

    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.isActive) {
      this.logger.info('auth_password_reset_request', {
        email: this.safeIdentifierForLogs(email),
        found: false,
      });
      return { status: 'ok' };
    }

    this.logger.info('auth_password_reset_request', {
      userId: user.id,
      email: this.safeIdentifierForLogs(email),
      found: true,
    });

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

    this.logger.info('auth_password_reset_email_sent', {
      userId: user.id,
      email: this.safeIdentifierForLogs(email),
      ttlMinutes: settings.auth.resetTokenTtlMinutes,
    });
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
      this.logger.warn('auth_password_reset_failed', {
        tokenId,
        reason: 'not_found',
      });
      throw new BadRequestException('Reset token is invalid.');
    }

    if (record.usedAt || Date.now() > Number(record.expiresAt)) {
      this.logger.warn('auth_password_reset_failed', {
        tokenId,
        reason: 'expired_or_used',
      });
      throw new BadRequestException('Reset token has expired.');
    }

    const matches = await argon2.verify(record.secretHash, secret);
    if (!matches) {
      this.logger.warn('auth_password_reset_failed', {
        tokenId,
        reason: 'hash_mismatch',
      });
      throw new BadRequestException('Reset token is invalid.');
    }

    const user = await this.users.findOne({ where: { id: record.userId } });
    if (!user) {
      this.logger.warn('auth_password_reset_failed', {
        tokenId,
        reason: 'user_missing',
      });
      throw new BadRequestException('Reset token is invalid.');
    }

    user.passwordHash = await argon2.hash(request.newPassword, {
      type: argon2.argon2id,
    });
    user.refreshTokenId = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.users.save(user);
    await this.revokeAllSessionsForUser(user.id, 'password_reset');
    record.usedAt = new Date().toISOString();
    await this.resetTokens.save(record);

    this.logger.info('auth_password_reset_success', {
      userId: user.id,
      tokenId,
    });
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
    this.logger.info('auth_2fa_setup_begin', { userId: user.id });
    const secret = generateTotpSecret();
    user.twoFactorTempSecret = await this.encryptTwoFactorSecret(secret);
    await this.users.save(user);
    const label = user.username ?? user.email;
    const issuer = 'Bookdarr Media Server';
    const otpauthUrl = buildOtpauthUrl({ issuer, label, secret });
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
    const secret = await this.resolveTwoFactorSecret(user.twoFactorTempSecret);
    const isValid = secret ? verifyTotpCode({ token: code, secret }) : false;
    if (!isValid) {
      throw new BadRequestException('Invalid two-factor code.');
    }
    user.twoFactorSecret = await this.encryptTwoFactorSecret(secret);
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    // Enabling 2FA revokes refresh tokens and invalidates existing access tokens.
    user.refreshTokenId = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.users.save(user);
    await this.revokeAllSessionsForUser(user.id, 'two_factor_enabled');
    const backupCodes = await this.generateAndStoreBackupCodes(user.id);
    this.logger.info('auth_2fa_enabled', { userId: user.id });
    return { enabled: true, backupCodes };
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
      const secret = await this.resolveTwoFactorSecret(user.twoFactorSecret);
      const isValid = secret
        ? verifyTotpCode({ token: input.code.trim(), secret })
        : false;
      if (!isValid) {
        throw new BadRequestException('Invalid two-factor code.');
      }
    } else if (input.currentPassword) {
      const matches = await argon2.verify(
        user.passwordHash,
        input.currentPassword,
      );
      if (!matches) {
        throw new UnauthorizedException('Current password is invalid.');
      }
    } else {
      throw new BadRequestException(
        'Two-factor code or current password is required.',
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.refreshTokenId = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.backupCodes.delete({ userId: user.id });
    await this.users.save(user);
    await this.revokeAllSessionsForUser(user.id, 'two_factor_disabled');
    this.logger.info('auth_2fa_disabled', { userId: user.id });
    return { enabled: false };
  }

  async adminResetTwoFactor(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new BadRequestException('User not found.');
    }
    if (user.isAdmin) {
      throw new BadRequestException('Admin 2FA cannot be reset here.');
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.refreshTokenId = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.backupCodes.delete({ userId: user.id });
    await this.users.save(user);
    await this.revokeAllSessionsForUser(user.id, 'admin_reset_two_factor');
    this.logger.warn('auth_2fa_admin_reset', { userId: user.id });
    return { status: 'ok' };
  }

  async adminResetPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length === 0) {
      throw new BadRequestException('New password is required.');
    }
    this.assertPassword(newPassword);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new BadRequestException('User not found.');
    }
    if (user.isAdmin) {
      throw new BadRequestException('Admin password cannot be reset here.');
    }
    user.passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });
    user.refreshTokenId = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.users.save(user);
    await this.revokeAllSessionsForUser(user.id, 'admin_reset_password');
    return { status: 'ok' };
  }

  async regenerateBackupCodes(
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
      throw new BadRequestException('Two-factor is not enabled.');
    }

    if (input.code) {
      const secret = await this.resolveTwoFactorSecret(user.twoFactorSecret);
      const isValid = secret
        ? verifyTotpCode({ token: input.code.trim(), secret })
        : false;
      if (!isValid) {
        throw new BadRequestException('Invalid two-factor code.');
      }
    } else if (input.currentPassword) {
      const matches = await argon2.verify(
        user.passwordHash,
        input.currentPassword,
      );
      if (!matches) {
        throw new UnauthorizedException('Current password is invalid.');
      }
    } else {
      throw new BadRequestException(
        'Two-factor code or current password is required.',
      );
    }

    await this.backupCodes.delete({ userId: user.id });
    const backupCodes = await this.generateAndStoreBackupCodes(user.id);
    this.logger.info('auth_2fa_backup_codes_regenerated', { userId: user.id });
    return { backupCodes };
  }

  async isSetupRequired(): Promise<boolean> {
    const total = await this.users.count();
    return total === 0;
  }

  private normalizeBackupCode(code: string) {
    return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private generateBackupCode() {
    const raw = randomBytes(9).toString('base64url');
    const normalized = this.normalizeBackupCode(raw).slice(0, 12);
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
  }

  private async generateAndStoreBackupCodes(userId: string, count = 10) {
    const codes: string[] = [];
    for (let i = 0; i < count; i += 1) {
      codes.push(this.generateBackupCode());
    }

    const now = new Date().toISOString();
    const records: TwoFactorBackupCodeEntity[] = [];
    for (const code of codes) {
      const normalized = this.normalizeBackupCode(code);
      const codeHash = await argon2.hash(normalized, { type: argon2.argon2id });
      records.push(
        this.backupCodes.create({
          userId,
          codeHash,
          createdAt: now,
          usedAt: null,
        }),
      );
    }
    await this.backupCodes.save(records);
    return codes;
  }

  private async tryConsumeBackupCode(userId: string, provided: string) {
    const normalized = this.normalizeBackupCode(provided ?? '');
    if (!normalized || normalized.length < 6) {
      return false;
    }
    const candidates = await this.backupCodes.find({
      where: { userId, usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    for (const candidate of candidates) {
      try {
        const ok = await argon2.verify(candidate.codeHash, normalized);
        if (ok) {
          candidate.usedAt = new Date().toISOString();
          await this.backupCodes.save(candidate);
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
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

  private safeIdentifierForLogs(value?: string | null) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return null;
    if (!trimmed.includes('@')) {
      return trimmed.length > 128 ? trimmed.slice(0, 128) : trimmed;
    }
    const [user, ...rest] = trimmed.split('@');
    const domain = rest.join('@');
    const prefix = (user ?? '').slice(0, 2);
    return `${prefix}${prefix ? '***' : '***'}@${domain}`;
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

  private async resolveTwoFactorSecret(
    stored?: string | null,
  ): Promise<string> {
    if (!stored) return '';
    if (!stored.startsWith('enc:v1:')) {
      return stored;
    }
    return this.decryptTwoFactorSecret(stored);
  }

  private async getTwoFactorKey(): Promise<Buffer> {
    const secrets = await this.authConfigService.getSecrets();
    const base = secrets.accessSecret?.trim();
    if (!base) {
      throw new ServiceUnavailableException('Auth secrets are not configured.');
    }
    return createHash('sha256').update(base, 'utf8').digest();
  }

  private async encryptTwoFactorSecret(secret: string): Promise<string> {
    const key = await this.getTwoFactorKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
  }

  private async decryptTwoFactorSecret(payload: string): Promise<string> {
    const parts = payload.split(':');
    if (parts.length !== 5) {
      return '';
    }
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const data = Buffer.from(parts[4], 'hex');
    const key = await this.getTwoFactorKey();
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    return plaintext.toString('utf8');
  }

  private async maybeUpgradeTwoFactorSecret(user: UserEntity, secret: string) {
    if (!user.twoFactorSecret || user.twoFactorSecret.startsWith('enc:v1:')) {
      return;
    }
    user.twoFactorSecret = await this.encryptTwoFactorSecret(secret);
    await this.users.save(user);
  }

  private normalizeMeta(meta?: ClientMeta): ClientMeta {
    return {
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    };
  }

  private async createSession(userId: string, meta?: ClientMeta) {
    const now = new Date().toISOString();
    const m = this.normalizeMeta(meta);
    const session = this.sessions.create({
      userId,
      refreshTokenId: null,
      createdAt: now,
      lastUsedAt: now,
      userAgent: m.userAgent ?? null,
      createdIp: m.ip ?? null,
      lastIp: m.ip ?? null,
      revokedAt: null,
      revokeReason: null,
    });
    return this.sessions.save(session);
  }

  private async revokeAllSessionsForUser(userId: string, reason: string) {
    const sessions = await this.sessions.find({ where: { userId } });
    if (sessions.length === 0) return;
    const now = new Date().toISOString();
    for (const session of sessions) {
      if (session.revokedAt) continue;
      session.revokedAt = now;
      session.revokeReason = reason;
      session.refreshTokenId = null;
    }
    await this.sessions.save(sessions);
  }

  private async issueTokens(user: UserEntity, meta?: ClientMeta): Promise<AuthTokens> {
    const auth = await this.getAuthSettings();
    const session = await this.createSession(user.id, meta);
    const refreshId = this.generateToken();
    session.refreshTokenId = refreshId;
    session.lastUsedAt = new Date().toISOString();
    session.lastIp = this.normalizeMeta(meta).ip ?? session.lastIp ?? null;
    await this.sessions.save(session);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        tv: user.tokenVersion ?? 0,
        sid: session.id,
      },
      {
        secret: auth.accessSecret,
        expiresIn: auth.accessTokenTtl as StringValue,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, sid: session.id, jti: refreshId, tv: user.tokenVersion ?? 0 },
      {
        secret: auth.refreshSecret,
        expiresIn: auth.refreshTokenTtl as StringValue,
      },
    );

    // Legacy field kept only for migration support. New logins always use auth_sessions.
    user.refreshTokenId = null;
    await this.users.save(user);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private async issueTokensForExistingSession(
    user: UserEntity,
    session: AuthSessionEntity,
    meta?: ClientMeta,
  ): Promise<AuthTokens> {
    const auth = await this.getAuthSettings();
    const refreshId = this.generateToken();

    session.refreshTokenId = refreshId;
    session.lastUsedAt = new Date().toISOString();
    const m = this.normalizeMeta(meta);
    session.lastIp = m.ip ?? session.lastIp ?? null;
    if (m.userAgent && !session.userAgent) {
      session.userAgent = m.userAgent;
    }
    await this.sessions.save(session);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        tv: user.tokenVersion ?? 0,
        sid: session.id,
      },
      {
        secret: auth.accessSecret,
        expiresIn: auth.accessTokenTtl as StringValue,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, sid: session.id, jti: refreshId, tv: user.tokenVersion ?? 0 },
      {
        secret: auth.refreshSecret,
        expiresIn: auth.refreshTokenTtl as StringValue,
      },
    );

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const auth = await this.getAuthSettings();
      return await this.jwtService.verifyAsync<{
        sub: string;
        jti: string;
        sid?: string;
        tv?: number;
      }>(
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
    const code = await this.inviteCodes.findOne({
      where: { code: normalized },
    });
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
    if (
      normalized.length < MIN_USERNAME_LENGTH ||
      normalized.length > MAX_USERNAME_LENGTH
    ) {
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
        const existing = await this.users.findOne({
          where: { username: candidate },
        });
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
