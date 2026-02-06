import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookdarrModule } from '../bookdarr/bookdarr.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { LoggingModule } from '../logging/logging.module';
import { OpenLibraryModule } from '../openlibrary/openlibrary.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryCacheService } from './library-cache.service';
import { UserLibraryEntity } from './user-library.entity';
import { UserLibraryService } from './user-library.service';
import { OfflineDownloadEntity } from './offline-download.entity';
import { OfflineDownloadService } from './offline-download.service';
import { ReaderProgressEntity } from './reader-progress.entity';
import { ReaderProgressService } from './reader-progress.service';
import { ReaderProgressController } from './reader-progress.controller';

@Module({
  imports: [
    BookdarrModule,
    OpenLibraryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SettingsModule),
    LoggingModule,
    TypeOrmModule.forFeature([
      UserLibraryEntity,
      OfflineDownloadEntity,
      ReaderProgressEntity,
    ]),
  ],
  controllers: [LibraryController, ReaderProgressController],
  providers: [
    LibraryService,
    LibraryCacheService,
    UserLibraryService,
    OfflineDownloadService,
    ReaderProgressService,
  ],
  exports: [ReaderProgressService],
})
export class LibraryModule {}
