import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SettingsService } from './settings/settings.service';
import { FileLoggerService } from './logging/file-logger.service';
import { RequestIdMiddleware } from './logging/request-id.middleware';
import { RequestLoggingMiddleware } from './logging/request-logging.middleware';
import { HttpExceptionFilter } from './logging/http-exception.filter';
import { CspNonceMiddleware } from './security/csp-nonce.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServer = app.getHttpAdapter().getInstance();
  if (httpServer?.disable) {
    httpServer.disable('etag');
  }
  if (typeof httpServer?.set === 'function') {
    // Respect x-forwarded-* headers when behind a reverse proxy (public web scenario).
    httpServer.set('trust proxy', 1);
  }

  const requestId = new RequestIdMiddleware();
  app.use(requestId.use.bind(requestId));
  const cspNonce = new CspNonceMiddleware();
  app.use(cspNonce.use.bind(cspNonce));

  // Basic security headers (CSP included). The app uses inline scripts/styles, so CSP permits
  // 'unsafe-inline' but still restricts sources to self (no remote CDNs).
  app.use((req, res, next) => {
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined) ??
      (req as any).protocol ??
      'http';
    const isSecure = proto === 'https';

    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('cross-origin-opener-policy', 'same-origin');
    res.setHeader('cross-origin-resource-policy', 'same-origin');
    res.setHeader(
      'permissions-policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    );

    if (isSecure) {
      res.setHeader(
        'strict-transport-security',
        'max-age=31536000; includeSubDomains',
      );
    }

    const nonce = (res.locals as any)?.cspNonce as string | undefined;
    const scriptSrc = nonce
      ? `script-src 'self' 'nonce-${nonce}'`
      : `script-src 'self'`;

    // Keep CSP permissive enough for our inline shell while disallowing external origins.
    res.setHeader(
      'content-security-policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        scriptSrc,
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "media-src 'self' data: blob:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
      ].join('; '),
    );

    next();
  });

  const publicPath = join(process.cwd(), 'public');
  if (existsSync(publicPath)) {
    app.use(
      express.static(publicPath, {
        fallthrough: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('sw.js')) {
            // Ensure SW updates are picked up quickly.
            res.setHeader('cache-control', 'no-store');
            res.setHeader('service-worker-allowed', '/');
          } else if (filePath.endsWith('.webmanifest')) {
            res.setHeader('cache-control', 'no-cache');
          }
        },
      }),
    );
  }
    const logger = app.get(FileLoggerService);
    const verboseLogs = process.env.VERBOSE_LOGS === 'true';
    const requestLogger = new RequestLoggingMiddleware(logger);
    app.use(requestLogger.use.bind(requestLogger));
    app.useGlobalFilters(new HttpExceptionFilter(logger));
    if (verboseLogs) {
      app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path ?? req.originalUrl ?? req.url ?? '';
        const queryKeys = req.query ? Object.keys(req.query) : [];
        const body = req.body;
        const bodyKeys =
          body && typeof body === 'object' && !Array.isArray(body)
          ? Object.keys(body)
          : [];

      logger.info('http_verbose_request', {
        method: req.method,
        path,
        requestId: (req as any).requestId ?? null,
        queryKeys,
        bodyKeys,
        ip: req.ip ?? req.socket?.remoteAddress ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      res.on('finish', () => {
        const userId = req.user?.userId ?? null;
        logger.info('http_verbose_response', {
          method: req.method,
          path,
          requestId: (req as any).requestId ?? null,
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
  const epubNodeModulesPath = join(
    process.cwd(),
    'node_modules',
    'epubjs',
    'dist',
  );
  const epubPath = existsSync(epubVendorPath)
    ? epubVendorPath
    : epubNodeModulesPath;
  if (existsSync(epubPath)) {
    app.use('/vendor/epub', express.static(epubPath));
  }
  // JSZip is required by the browser-only epub.js build.
  const jszipVendorPath = join(process.cwd(), 'vendor', 'jszip');
  const jszipNodeModulesPath = join(
    process.cwd(),
    'node_modules',
    'jszip',
    'dist',
  );
  const jszipPath = existsSync(jszipVendorPath)
    ? jszipVendorPath
    : jszipNodeModulesPath;
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
