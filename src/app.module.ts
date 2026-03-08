import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { QueueHandlerModule } from './modules/queue-handler/queue-handler.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    CatalogModule,
    ReviewsModule,
    ScraperModule,
    QueueHandlerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
