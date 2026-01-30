import { Module } from '@nestjs/common';
import { BookdarrModule } from '../bookdarr/bookdarr.module';
import { OpenLibraryModule } from '../openlibrary/openlibrary.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [BookdarrModule, OpenLibraryModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
