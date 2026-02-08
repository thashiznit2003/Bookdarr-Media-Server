import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// Minimal RFC 6238 (TOTP) implementation so we don't depend on ESM-only OTP libs
// (Jest e2e needs to execute 2FA flows).
//
// Authenticator apps expect:
// - Base32 secret (RFC 4648 alphabet, no padding)
// - HMAC-SHA1
// - 6 digits
// - 30s time step

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function normalizeBase32(input: string) {
  return (input || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      const index = (value >> (bits - 5)) & 31;
      bits -= 5;
      output += BASE32_ALPHABET[index]!;
    }
  }
  if (bits > 0) {
    const index = (value << (5 - bits)) & 31;
    output += BASE32_ALPHABET[index]!;
  }
  return output;
}

export function base32Decode(secret: string): Buffer {
  const normalized = normalizeBase32(secret);
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of normalized) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function buildOtpauthUrl(input: {
  issuer: string;
  label: string;
  secret: string;
}): string {
  const issuer = (input.issuer || '').trim();
  const label = (input.label || '').trim();
  const secret = normalizeBase32(input.secret);
  const account = encodeURIComponent(`${issuer}:${label}`);
  const qs = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${account}?${qs.toString()}`;
}

function hotp(key: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  // Counter fits into JS safe integer for our use (time steps).
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(code).padStart(digits, '0');
}

export function generateTotpCode(
  secret: string,
  timeMs: number = Date.now(),
): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timeMs / 1000 / 30);
  return hotp(key, counter, 6);
}

export function verifyTotpCode(input: {
  token: string;
  secret: string;
  window?: number;
  timeMs?: number;
}): boolean {
  const token = (input.token || '').trim();
  if (!/^\d{6}$/.test(token)) return false;
  const key = base32Decode(input.secret);
  if (key.length === 0) return false;

  const timeMs = input.timeMs ?? Date.now();
  const counter = Math.floor(timeMs / 1000 / 30);
  const window = typeof input.window === 'number' ? input.window : 1;

  // Constant-time compare against candidate codes.
  const tokenBuf = Buffer.from(token, 'utf8');
  for (let step = -window; step <= window; step += 1) {
    const candidate = hotp(key, counter + step, 6);
    const candBuf = Buffer.from(candidate, 'utf8');
    if (candBuf.length === tokenBuf.length && timingSafeEqual(candBuf, tokenBuf)) {
      return true;
    }
  }
  return false;
}

