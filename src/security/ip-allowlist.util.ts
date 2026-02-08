import * as ipaddr from 'ipaddr.js';

export type ParsedCidr = [ipaddr.IPv4 | ipaddr.IPv6, number];

function stripPortAndBrackets(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  // [IPv6]:port
  if (value.startsWith('[')) {
    const idx = value.indexOf(']');
    if (idx > 0) {
      return value.slice(1, idx);
    }
  }

  // IPv4:port (avoid breaking IPv6 which also contains ':')
  const lastColon = value.lastIndexOf(':');
  if (lastColon > -1) {
    const maybeHost = value.slice(0, lastColon);
    const maybePort = value.slice(lastColon + 1);
    if (/^\\d+$/.test(maybePort) && ipaddr.isValid(maybeHost)) {
      const parsed = ipaddr.parse(maybeHost);
      if (parsed.kind() === 'ipv4') return maybeHost;
    }
  }

  // IPv6 zone id (e.g., fe80::1%lo0)
  const zoneIdx = value.indexOf('%');
  if (zoneIdx > 0) return value.slice(0, zoneIdx);

  return value;
}

export function normalizeClientIp(
  input: string | undefined | null,
): ipaddr.IPv4 | ipaddr.IPv6 | null {
  if (!input) return null;
  const raw = stripPortAndBrackets((input.split(',')[0] ?? '').trim());
  if (!raw) return null;
  if (!ipaddr.isValid(raw)) return null;

  const parsed = ipaddr.parse(raw);
  if (parsed.kind() === 'ipv6' && (parsed as any).isIPv4MappedAddress?.()) {
    return (parsed as any).toIPv4Address();
  }
  return parsed;
}

export function parseIpAllowlist(
  csv: string | undefined | null,
): ParsedCidr[] | null {
  const raw = (csv ?? '').trim();
  if (!raw) return null;

  const entries = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const parsed: ParsedCidr[] = [];
  for (const entry of entries) {
    try {
      if (entry.includes('/')) {
        const [addr, prefix] = ipaddr.parseCIDR(entry) as any;
        parsed.push([addr, prefix]);
      } else if (ipaddr.isValid(entry)) {
        const addr = ipaddr.parse(entry) as any;
        const max = addr.kind() === 'ipv4' ? 32 : 128;
        parsed.push([addr, max]);
      }
    } catch {
      // ignore invalid entries
    }
  }

  return parsed;
}

export function isIpAllowed(
  clientIp: ipaddr.IPv4 | ipaddr.IPv6 | null,
  allowlist: ParsedCidr[] | null,
) {
  // No allowlist configured means "allow all".
  if (!allowlist) return true;
  if (!clientIp) return false;
  if (allowlist.length === 0) return false;

  for (const [network, prefix] of allowlist) {
    try {
      if (clientIp.kind() !== network.kind()) continue;
      if ((clientIp as any).match(network, prefix)) return true;
    } catch {
      // ignore matcher errors
    }
  }
  return false;
}

