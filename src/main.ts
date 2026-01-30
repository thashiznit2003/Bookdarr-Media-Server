import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SettingsService } from './settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const settings = app.get(SettingsService);
  await app.listen(settings.getSettings().port);
}
bootstrap();
