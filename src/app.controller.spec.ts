import { AppService } from './app.service';

describe('AppService', () => {
  it('should return the Plex-style HTML shell', () => {
    const appService = new AppService();
    const html = appService.getIndexHtml({
      token: null,
      refreshToken: null,
      user: { id: 'test', username: 'test', email: 'test@example.com', isAdmin: true },
    });
    expect(html).toContain('Bookdarr Media Server');
    expect(html).toContain('Book Pool Library');
  });
});
