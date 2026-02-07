import { Injectable } from '@nestjs/common';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || now >= existing.resetAt) {
      const bucket: Bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, retryAfterMs: 0 };
    }

    if (existing.count >= max) {
      return { allowed: false, retryAfterMs: Math.max(existing.resetAt - now, 0) };
    }

    existing.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
}

