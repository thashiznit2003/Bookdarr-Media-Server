import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
})
export class DiagnosticsModule {}
