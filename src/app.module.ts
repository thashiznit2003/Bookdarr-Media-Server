import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettingsModule } from './settings/settings.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';

@Module({
  imports: [SettingsModule, DiagnosticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
