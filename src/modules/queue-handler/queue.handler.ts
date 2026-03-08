import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ScraperService } from '../scraper/scraper.service';
import { CatalogService } from '../catalog/catalog.service';
import { ReviewsService } from '../reviews/reviews.service';
import { PrismaService } from '../../prisma.service';
import { LogStatus } from '@prisma/client';

interface EnqueueCategoryPayload {
  categoryId: string;
  categoryUrl: string;
}

@Injectable()
export class QueueHandler {
  constructor(
    private readonly scraper: ScraperService,
    private readonly catalog: CatalogService,
    private readonly reviews: ReviewsService,
    private readonly prisma: PrismaService,
    @InjectQueue('category')
    private readonly categoryQueue: Queue<EnqueueCategoryPayload>,
  ) {}

  async enqueueCategory(
    categoryId: string,
    categoryUrl: string,
  ): Promise<void> {
    await this.categoryQueue.add('parse-category', { categoryId, categoryUrl });
  }

  async processCategory(
    categoryNameOrId: string,
    categoryUrl: string,
  ): Promise<void> {
    const categoryId = await this.catalog.ensureCategory(
      categoryNameOrId,
      categoryUrl,
    );

    const categoryLogStart = Date.now();
    const categoryLog = await this.prisma.parsingLog.create({
      data: {
        entityType: 'category',
        entityId: categoryId,
        status: LogStatus.IN_PROGRESS,
      },
    });

    try {
      const asins = await this.scraper.fetchAsinsFromCategory(categoryUrl);

      for (const asin of asins.slice(0, 50)) {
        const productStart = Date.now();
        try {
          const productData = await this.scraper.parseProductDetails(asin);
          const product = await this.catalog.upsertProduct({
            ...productData,
            categoryId,
          });

          const reviewsData = await this.scraper.parseReviews(asin);
          await this.reviews.saveBatchReviews(product.id, reviewsData);

          await this.prisma.parsingLog.create({
            data: {
              entityType: 'product',
              entityId: asin,
              status: LogStatus.SUCCESS,
              durationMs: Date.now() - productStart,
            },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await this.prisma.parsingLog.create({
            data: {
              entityType: 'product',
              entityId: asin,
              status: LogStatus.FAILED,
              errorMessage: msg,
              durationMs: Date.now() - productStart,
            },
          });
          throw err;
        }

        await new Promise((res) =>
          setTimeout(res, Math.random() * 3000 + 2000),
        );
      }

      await this.prisma.parsingLog.update({
        where: { id: categoryLog.id },
        data: {
          status: LogStatus.SUCCESS,
          durationMs: Date.now() - categoryLogStart,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.prisma.parsingLog.update({
        where: { id: categoryLog.id },
        data: {
          status: LogStatus.FAILED,
          errorMessage: msg,
          durationMs: Date.now() - categoryLogStart,
        },
      });
      throw err;
    }
  }
}
