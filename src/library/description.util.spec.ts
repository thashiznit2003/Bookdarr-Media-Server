import { normalizeBookDescription } from './description.util';

describe('normalizeBookDescription', () => {
  it('strips HTML tags without removing letters', () => {
    const raw =
      '<b><i>New York Times Bestselling Author.</i></b><br><br>' +
      'Millions of books sold worldwide! Success is possible.';
    const out = normalizeBookDescription(raw);
    expect(out).toContain('New York Times Bestselling Author.');
    expect(out).toContain('Millions of books sold worldwide!');
    expect(out).toContain('Success is possible.');
    // Ensure we did not accidentally treat "\\s" as "s" in a RegExp string.
    expect(out).toContain('Times');
    expect(out).toContain('Bestselling');
    expect(out).toContain('Millions');
    expect(out).toContain('Success');
  });

  it('decodes common HTML entities and preserves newlines', () => {
    const raw = 'A &amp; B<br>Line&nbsp;2&#10;Line 3';
    const out = normalizeBookDescription(raw);
    expect(out).toBe('A & B\nLine 2\nLine 3');
  });

  it('returns undefined for empty input', () => {
    expect(normalizeBookDescription('')).toBeUndefined();
    expect(normalizeBookDescription('   ')).toBeUndefined();
    expect(normalizeBookDescription(null)).toBeUndefined();
  });
});

