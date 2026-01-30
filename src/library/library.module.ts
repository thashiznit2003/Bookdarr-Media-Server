import { Module, forwardRef } from '@nestjs/common';
import { BookdarrModule } from '../bookdarr/bookdarr.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { OpenLibraryModule } from '../openlibrary/openlibrary.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [
    BookdarrModule,
    OpenLibraryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SettingsModule),
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
