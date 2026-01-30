import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookdarrModule } from '../bookdarr/bookdarr.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { OpenLibraryModule } from '../openlibrary/openlibrary.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryCacheService } from './library-cache.service';
import { UserLibraryEntity } from './user-library.entity';
import { UserLibraryService } from './user-library.service';

@Module({
  imports: [
    BookdarrModule,
    OpenLibraryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SettingsModule),
    TypeOrmModule.forFeature([UserLibraryEntity]),
  ],
  controllers: [LibraryController],
  providers: [LibraryService, LibraryCacheService, UserLibraryService],
})
export class LibraryModule {}
