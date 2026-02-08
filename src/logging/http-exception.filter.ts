import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileLoggerService } from './file-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: FileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error('http_exception', {
      method: request.method,
      path: request.originalUrl,
      requestId: (request as any).requestId ?? null,
      status,
      message: isHttpException ? exception.message : 'Unexpected error',
    });

    if (isHttpException) {
      const payload = exception.getResponse();
      if (payload && typeof payload === 'object') {
        try {
          // Guard against accidentally returning circular objects (ex: raw request/socket references).
          JSON.stringify(payload);
          return response.status(status).json(payload);
        } catch {
          return response.status(status).json({
            statusCode: status,
            message: exception.message,
            requestId: (request as any).requestId ?? null,
          });
        }
      }
      return response.status(status).json(payload);
    }

    return response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
      requestId: (request as any).requestId ?? null,
    });
  }
}
