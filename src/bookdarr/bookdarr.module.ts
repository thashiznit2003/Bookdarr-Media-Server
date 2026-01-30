import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { BookdarrService } from './bookdarr.service';

@Module({
  imports: [SettingsModule],
  providers: [BookdarrService],
  exports: [BookdarrService],
})
export class BookdarrModule {}
