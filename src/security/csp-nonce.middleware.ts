import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class CspNonceMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    // Base64 is safe for CSP nonces; the browser compares raw base64 bytes.
    (res.locals as any).cspNonce = randomBytes(16).toString('base64');
    next();
  }
}

