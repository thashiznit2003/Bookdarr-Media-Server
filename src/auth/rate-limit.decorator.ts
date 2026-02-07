import { SetMetadata } from '@nestjs/common';

export type RateLimitScope = 'ip' | 'ip+username' | 'ip+email';

export type RateLimitRule = {
  id: string;
  max: number;
  windowMs: number;
  scope: RateLimitScope;
};

export const RATE_LIMIT_RULES = 'rateLimitRules';

export function RateLimit(rules: RateLimitRule | RateLimitRule[]) {
  const list = Array.isArray(rules) ? rules : [rules];
  return SetMetadata(RATE_LIMIT_RULES, list);
}

