import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getIndex(@Req() req: Request, @Res() res: Response) {
    if (!this.hasAuthCookie(req)) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.send(this.appService.getIndexHtml());
  }

  @Get('login')
  getLogin(@Req() req: Request, @Res() res: Response) {
    if (this.hasAuthCookie(req)) {
      return res.redirect('/');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.send(this.appService.getLoginHtml());
  }

  @Get(['downloads', 'diagnostics', 'settings', 'accounts', 'my-library'])
  getPage(@Req() req: Request, @Res() res: Response) {
    if (!this.hasAuthCookie(req)) {
      return res.redirect('/login');
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.send(this.appService.getIndexHtml());
  }

  private hasAuthCookie(req: Request): boolean {
    const raw = req.headers?.cookie;
    if (!raw) return false;
    return raw.split(';').some((cookie) => cookie.trim().startsWith('bmsLoggedIn=1'));
  }
}
