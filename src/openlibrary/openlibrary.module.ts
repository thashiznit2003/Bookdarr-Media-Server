import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { OpenLibraryService } from './openlibrary.service';

@Module({
  imports: [SettingsModule],
  providers: [OpenLibraryService],
  exports: [OpenLibraryService],
})
export class OpenLibraryModule {}
