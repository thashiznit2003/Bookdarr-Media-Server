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
  const httpServer = app.getHttpAdapter().getInstance();
  if (httpServer?.disable) {
    httpServer.disable('etag');
  }
  const logger = app.get(FileLoggerService);
  const verboseLogs = process.env.VERBOSE_LOGS === 'true';
  const requestLogger = new RequestLoggingMiddleware(logger);
  app.use(requestLogger.use.bind(requestLogger));
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  if (verboseLogs) {
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.originalUrl ?? req.url ?? '';
      const queryKeys = req.query ? Object.keys(req.query) : [];
      const body = (req as any).body;
      const bodyKeys =
        body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];

      logger.info('http_verbose_request', {
        method: req.method,
        path,
        queryKeys,
        bodyKeys,
        ip: req.ip ?? req.socket?.remoteAddress ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      res.on('finish', () => {
        const userId = (req as any).user?.userId ?? null;
        logger.info('http_verbose_response', {
          method: req.method,
          path,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          userId,
        });
      });
      next();
    });
  }

  // EPUB reader is browser-only; keep it vendored so npm installs stay clean and predictable.
  const epubVendorPath = join(process.cwd(), 'vendor', 'epub');
  const epubNodeModulesPath = join(process.cwd(), 'node_modules', 'epubjs', 'dist');
  const epubPath = existsSync(epubVendorPath) ? epubVendorPath : epubNodeModulesPath;
  if (existsSync(epubPath)) {
    app.use('/vendor/epub', express.static(epubPath));
  }
  const jszipPath = join(process.cwd(), 'node_modules', 'jszip', 'dist');
  if (existsSync(jszipPath)) {
    app.use('/vendor/jszip', express.static(jszipPath));
  }
  const pdfPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build');
  if (existsSync(pdfPath)) {
    app.use('/vendor/pdfjs', express.static(pdfPath));
  }
  const settings = app.get(SettingsService);
  await app.listen(settings.getSettings().port);
}
bootstrap();
