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
import { UserEntity } from '../auth/entities/user.entity';
import { LibraryStreamingService } from './library-streaming.service';
import { ApiV1LibraryController } from './api-v1-library.controller';
import { ApiV1ReaderProgressController } from './api-v1-reader-progress.controller';

@Module({
  imports: [
    BookdarrModule,
    OpenLibraryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SettingsModule),
    LoggingModule,
    TypeOrmModule.forFeature([
      // Needed because LibraryController uses AdminGuard, which injects the UserEntity repository.
      // Without this, the app can crash at startup with UnknownDependenciesException.
      UserEntity,
      UserLibraryEntity,
      OfflineDownloadEntity,
      ReaderProgressEntity,
    ]),
  ],
  controllers: [
    LibraryController,
    ReaderProgressController,
    ApiV1LibraryController,
    ApiV1ReaderProgressController,
  ],
  providers: [
    LibraryService,
    LibraryCacheService,
    UserLibraryService,
    OfflineDownloadService,
    LibraryStreamingService,
    ReaderProgressService,
  ],
  exports: [ReaderProgressService],
})
export class LibraryModule {}
