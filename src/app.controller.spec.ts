import { AppService } from './app.service';

describe('AppService', () => {
  it('should return the Plex-style HTML shell', () => {
    const appService = new AppService();
    const html = appService.getIndexHtml({
      token: null,
      refreshToken: null,
      user: {
        id: 'test',
        username: 'test',
        email: 'test@example.com',
        isAdmin: true,
      },
    });
    expect(html).toContain('Bookdarr Media Server');
    expect(html).toContain('Book Pool Library');
  });

  it('escapes template JS regexes so the browser receives \\\\s (whitespace) not s (letter)', () => {
    const appService = new AppService();
    const html = appService.getIndexHtml({
      token: null,
      refreshToken: null,
      user: {
        id: 'test',
        username: 'test',
        email: 'test@example.com',
        isAdmin: true,
      },
    });
    // The generated HTML must contain the literal characters: split(/\\s+/)
    // (one backslash in the HTML, escaped as \\ in this JS string literal).
    expect(html).toContain('split(/\\s+/)');
  });
});
