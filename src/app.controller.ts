import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('content-type', 'text/html; charset=utf-8')
  getIndex(): string {
    return this.appService.getIndexHtml();
  }

  @Get('login')
  @Header('content-type', 'text/html; charset=utf-8')
  getLogin(): string {
    return this.appService.getLoginHtml();
  }

  @Get(['downloads', 'diagnostics', 'settings', 'accounts', 'my-library'])
  @Header('content-type', 'text/html; charset=utf-8')
  getPage(): string {
    return this.appService.getIndexHtml();
  }
}
