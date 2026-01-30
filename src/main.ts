import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SettingsService } from './settings/settings.service';
import { FileLoggerService } from './logging/file-logger.service';
import { RequestLoggingMiddleware } from './logging/request-logging.middleware';
import { HttpExceptionFilter } from './logging/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(FileLoggerService);
  const requestLogger = new RequestLoggingMiddleware(logger);
  app.use(requestLogger.use.bind(requestLogger));
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  const epubPath = join(process.cwd(), 'node_modules', 'epubjs', 'dist');
  if (existsSync(epubPath)) {
    app.use('/vendor/epub', express.static(epubPath));
  }
  const pdfPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build');
  if (existsSync(pdfPath)) {
    app.use('/vendor/pdfjs', express.static(pdfPath));
  }

  const settings = app.get(SettingsService);
  await app.listen(settings.getSettings().port);
}
bootstrap();
