import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  isIpAllowed,
  normalizeClientIp,
  parseIpAllowlist,
  ParsedCidr,
} from '../security/ip-allowlist.util';

@Injectable()
export class AdminGuard implements CanActivate {
  // Parse once at startup. If ADMIN_IP_ALLOWLIST is set but invalid, we fail closed (deny).
  private readonly allowlist: ParsedCidr[] | null =
    parseIpAllowlist(process.env.ADMIN_IP_ALLOWLIST) ?? [];

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
        throw new ForbiddenException('Admin access required.');
      }
    }

    const user = request?.user;
    if (!user?.userId) {
      throw new UnauthorizedException('Unauthorized.');
    }

    // JwtStrategy already validates user existence + isActive + tokenVersion/session.
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
