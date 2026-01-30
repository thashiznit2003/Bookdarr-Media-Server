import { randomUUID } from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  isActive: boolean;
  refreshTokenId?: string;
}

export interface ResetTokenRecord {
  tokenHash: string;
  userId: string;
  expiresAt: number;
  used: boolean;
}

export class AuthStore {
  private readonly usersByEmail = new Map<string, UserRecord>();
  private readonly usersById = new Map<string, UserRecord>();
  private readonly usedInviteCodes = new Set<string>();
  private readonly resetTokens = new Map<string, ResetTokenRecord>();

  createUser(params: { email: string; passwordHash: string }): UserRecord {
    const user: UserRecord = {
      id: randomUUID(),
      email: params.email,
      passwordHash: params.passwordHash,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.usersByEmail.set(user.email.toLowerCase(), user);
    this.usersById.set(user.id, user);

    return user;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  findUserById(id: string): UserRecord | undefined {
    return this.usersById.get(id);
  }

  updateUser(user: UserRecord): void {
    this.usersByEmail.set(user.email.toLowerCase(), user);
    this.usersById.set(user.id, user);
  }

  markInviteCodeUsed(code: string): void {
    this.usedInviteCodes.add(code);
  }

  isInviteCodeUsed(code: string): boolean {
    return this.usedInviteCodes.has(code);
  }

  storeResetToken(tokenId: string, record: ResetTokenRecord): void {
    this.resetTokens.set(tokenId, record);
  }

  getResetToken(tokenId: string): ResetTokenRecord | undefined {
    return this.resetTokens.get(tokenId);
  }

  markResetTokenUsed(tokenId: string): void {
    const record = this.resetTokens.get(tokenId);
    if (record) {
      record.used = true;
      this.resetTokens.set(tokenId, record);
    }
  }
}
