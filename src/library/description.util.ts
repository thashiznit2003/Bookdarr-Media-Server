// Minimal, dependency-free HTML-ish description normalization.
// Bookdarr/OpenLibrary descriptions can contain inline HTML. We never want to
// render it as HTML in the UI (XSS risk), but we also don't want raw tags.

function decodeHtmlEntities(input: string): string {
  // Decode a small set of common named entities first.
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
  };

  let out = input.replace(/&([a-zA-Z]+);/g, (m, name) => {
    const key = String(name || "").toLowerCase();
    return Object.prototype.hasOwnProperty.call(named, key) ? named[key] : m;
  });

  // Decode numeric entities.
  out = out.replace(/&#(\d+);/g, (m, num) => {
    const n = Number.parseInt(String(num), 10);
    if (!Number.isFinite(n) || n <= 0) return m;
    try {
      return String.fromCodePoint(n);
    } catch {
      return m;
    }
  });
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
    const n = Number.parseInt(String(hex), 16);
    if (!Number.isFinite(n) || n <= 0) return m;
    try {
      return String.fromCodePoint(n);
    } catch {
      return m;
    }
  });

  return out;
}

export function normalizeBookDescription(raw?: string | null): string | undefined {
  const input = (raw ?? "").trim();
  if (!input) return undefined;

  let text = input;

  // Normalize common line-break tags before stripping.
  text = text.replace(/<\s*br\s*\/?>/gi, "\n");
  text = text.replace(/<\s*\/p\s*>/gi, "\n");
  text = text.replace(/<\s*p\s*>/gi, "");

  // List items become bullet-ish lines.
  text = text.replace(/<\s*li\s*>/gi, "\n- ");
  text = text.replace(/<\s*\/li\s*>/gi, "");
  text = text.replace(/<\s*\/ul\s*>/gi, "\n");
  text = text.replace(/<\s*ul\s*>/gi, "");

  // Strip any remaining tags.
  text = text.replace(/<[^>]+>/g, "");

  // Decode entities after stripping tags (so tags don't turn back into markup).
  text = decodeHtmlEntities(text);

  // Normalize line endings and whitespace. Preserve newlines.
  text = text.replace(/\r\n?/g, "\n");
  text = text.replace(/[\t\f\v ]+/g, " ");
  text = text.replace(/ *\n */g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text || undefined;
}
