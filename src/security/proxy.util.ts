import type { Request } from 'express';

function firstHeaderValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.split(',')[0]?.trim() || undefined;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].split(',')[0]?.trim() || undefined;
  }
  return undefined;
}

export function getForwardedProto(req: Request): string {
  return (
    firstHeaderValue(req.headers['x-forwarded-proto']) ??
    ((req as any).protocol as string | undefined) ??
    'http'
  );
}

export function getForwardedHost(req: Request): string | undefined {
  return (
    firstHeaderValue(req.headers['x-forwarded-host']) ??
    (req.get('host') as string | undefined) ??
    undefined
  );
}

export function isSecureRequest(req: Request): boolean {
  const proto = getForwardedProto(req);
  return proto === 'https' || Boolean((req as any).secure);
}

export function getBaseUrlFromRequest(req: Request): string | undefined {
  const host = getForwardedHost(req);
  if (!host) return undefined;
  const proto = getForwardedProto(req);
  return `${proto}://${host}`;
}

