import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { QueueHandlerModule } from './modules/queue-handler/queue-handler.module';

@Module({
  imports: [CatalogModule, ReviewsModule, ScraperModule, QueueHandlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
