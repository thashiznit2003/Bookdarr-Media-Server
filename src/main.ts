import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Server as ReadiumServer } from 'r2-streamer-js';
import { AppModule } from './app.module';
import { AuthConfigService } from './auth/auth-config.service';
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
  const forceReadium = process.env.FORCE_READIUM === 'true';
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
        forceReadium,
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

  const epubPath = join(process.cwd(), 'node_modules', 'epubjs', 'dist');
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
  const readiumNavPath = join(process.cwd(), 'node_modules', '@readium', 'navigator', 'dist');
  if (existsSync(readiumNavPath)) {
    app.use('/vendor/readium-navigator', express.static(readiumNavPath));
  }
  const readiumSharedPath = join(process.cwd(), 'node_modules', '@readium', 'shared', 'dist');
  if (existsSync(readiumSharedPath)) {
    app.use('/vendor/readium-shared', express.static(readiumSharedPath));
  }

  const readiumServer = new ReadiumServer({
    disableReaders: true,
    disableOPDS: true,
    disableRemotePubUrl: false,
  });
  const readiumExpress = (readiumServer as any).expressApp as express.Express;
  readiumExpress.use((req, res, next) => {
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = (name: string, value: any) => {
      if (typeof name === 'string' && name.toLowerCase() === 'link') {
        return res;
      }
      return originalSetHeader(name, value);
    };
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = ((statusCode: number, statusMessage?: any, headers?: any) => {
      if (typeof statusMessage === 'object' && statusMessage) {
        const filtered = { ...statusMessage };
        delete filtered.Link;
        delete filtered.link;
        return originalWriteHead(statusCode, filtered);
      }
      if (headers && typeof headers === 'object') {
        const filtered = { ...headers };
        delete filtered.Link;
        delete filtered.link;
        return originalWriteHead(statusCode, statusMessage, filtered);
      }
      return originalWriteHead(statusCode, statusMessage);
    }) as any;
    res.removeHeader('Link');
    next();
  });
  readiumExpress.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('readium_request', {
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        range: req.headers?.range ?? null,
        referer: req.headers?.referer ?? null,
      });
    });
    next();
  });
  const authConfig = app.get(AuthConfigService);
  const jwtService = app.get(JwtService);
  readiumExpress.use((req, res, next) => {
    void (async () => {
      const auth = settings.getSettings().auth;
      const secrets = await authConfig.getSecrets();
      const secret = secrets.accessSecret ?? auth.accessSecret;
      if (!secret) {
        next();
        return;
      }
      const header = req.headers.authorization;
      let token =
        typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
          ? header.slice(7)
          : null;
      if (!token) {
        const queryToken = req.query?.token ?? req.query?.accessToken;
        token = typeof queryToken === 'string' ? queryToken : null;
      }
      if (!token && typeof req.headers.cookie === 'string') {
        const cookieToken = req.headers.cookie
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith('bmsAccessToken='));
        if (cookieToken) {
          token = decodeURIComponent(cookieToken.slice('bmsAccessToken='.length));
        }
      }
      if (!token) {
        res.status(401).send('Unauthorized');
        return;
      }
      try {
        await jwtService.verifyAsync(token, { secret });
        next();
      } catch {
        res.status(401).send('Unauthorized');
      }
    })().catch(() => {
      res.status(500).send('Internal Server Error');
    });
  });
  app.use('/readium', readiumExpress);
  app.use('/pub', (req, res, next) => {
    req.url = '/pub' + req.url;
    readiumExpress(req, res, next);
  });
  await app.listen(settings.getSettings().port);
}
bootstrap();
