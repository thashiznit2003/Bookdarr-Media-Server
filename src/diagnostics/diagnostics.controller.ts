import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DiagnosticsPayload } from './diagnostics.types';
import { DiagnosticsService } from './diagnostics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async pushDiagnostics(@Body() payload: DiagnosticsPayload) {
    return this.diagnosticsService.push(payload);
  }
}
