import { Body, Controller, Post } from '@nestjs/common';
import { DiagnosticsPayload } from './diagnostics.types';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post()
  async pushDiagnostics(@Body() payload: DiagnosticsPayload) {
    return this.diagnosticsService.push(payload);
  }
}
