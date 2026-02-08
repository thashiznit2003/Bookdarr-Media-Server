import { Controller, Get, Header } from '@nestjs/common';
import { getApiV1OpenApiSpec } from './api-v1.openapi';

@Controller('api/v1')
export class ApiV1OpenApiController {
  @Get('openapi.json')
  @Header('cache-control', 'no-store')
  getSpec() {
    return getApiV1OpenApiSpec();
  }
}

