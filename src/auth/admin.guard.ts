import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { FileLoggerService } from '../logging/file-logger.service';
import {
  isIpAllowed,
  normalizeClientIp,
  parseIpAllowlist,
  ParsedCidr,
} from '../security/ip-allowlist.util';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly allowlist: ParsedCidr[] | null;

  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly logger: FileLoggerService,
  ) {
    // Parse once at startup. If ADMIN_IP_ALLOWLIST is set but invalid, we fail closed (deny).
    this.allowlist = parseIpAllowlist(process.env.ADMIN_IP_ALLOWLIST) ?? [];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Optional IP allowlist for admin endpoints (defense-in-depth).
    const rawAllowlist = (process.env.ADMIN_IP_ALLOWLIST ?? '').trim();
    if (rawAllowlist.length > 0) {
      const xfwd = request?.headers?.['x-forwarded-for'];
      const ipRaw =
        (typeof xfwd === 'string' ? xfwd : undefined) ??
        request?.ip ??
        request?.socket?.remoteAddress ??
        null;
      const ip = normalizeClientIp(ipRaw);
      if (!isIpAllowed(ip, this.allowlist)) {
        this.logger.warn('admin_ip_allowlist_denied', { ip: ipRaw });
        throw new ForbiddenException('Admin access required.');
      }
    }

    const userId = request?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new ForbiddenException('Admin access required.');
    }
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
