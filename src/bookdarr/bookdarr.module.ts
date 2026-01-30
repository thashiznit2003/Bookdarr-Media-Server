import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { BookdarrService } from './bookdarr.service';
import { BookdarrConfigController } from './bookdarr-config.controller';
import { BookdarrConfigService } from './bookdarr-config.service';
import { BookdarrConfigEntity } from './bookdarr-config.entity';

@Module({
  imports: [
    forwardRef(() => SettingsModule),
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([BookdarrConfigEntity]),
  ],
  controllers: [BookdarrConfigController],
  providers: [BookdarrService, BookdarrConfigService],
  exports: [BookdarrService, BookdarrConfigService],
})
export class BookdarrModule {}
