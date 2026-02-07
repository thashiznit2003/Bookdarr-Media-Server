import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_RULES, RateLimitRule } from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimit: RateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rules =
      this.reflector.getAllAndOverride<RateLimitRule[]>(RATE_LIMIT_RULES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (rules.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const ip =
      (typeof req.headers?.['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : undefined) ??
      req.ip ??
      req.socket?.remoteAddress ??
      'unknown';

    const username = (req.body?.username ?? '').toString().trim().toLowerCase();
    const email = (req.body?.email ?? '').toString().trim().toLowerCase();

    for (const rule of rules) {
      let key = `${rule.id}:${ip}`;
      if (rule.scope === 'ip+username') {
        key = `${rule.id}:${ip}:${username || 'unknown'}`;
      } else if (rule.scope === 'ip+email') {
        key = `${rule.id}:${ip}:${email || 'unknown'}`;
      }

      const result = this.rateLimit.consume(key, rule.max, rule.windowMs);
      if (!result.allowed) {
        const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
        throw new HttpException(
          {
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }
}
