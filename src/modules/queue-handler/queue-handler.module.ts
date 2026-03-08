import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueHandler } from './queue.handler';
import { CategoryProcessor } from './category.processor';
import { ScraperModule } from '../scraper/scraper.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    ScraperModule,
    CatalogModule,
    ReviewsModule,
    BullModule.registerQueue({
      name: 'category',
    }),
  ],
  providers: [QueueHandler, CategoryProcessor, PrismaService],
  exports: [QueueHandler],
})
export class QueueHandlerModule {}
