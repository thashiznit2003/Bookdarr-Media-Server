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
      status,
      message: isHttpException ? exception.message : 'Unexpected error',
    });

    if (isHttpException) {
      return response.status(status).json(exception.getResponse());
    }

    return response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    });
  }
}
