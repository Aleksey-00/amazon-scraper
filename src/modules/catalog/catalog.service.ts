import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async ensureCategory(name: string, url: string): Promise<string> {
    const category = await this.prisma.category.upsert({
      where: { url },
      update: { name },
      create: { name, url },
    });
    return category.id;
  }

  async upsertProduct(data: {
    asin: string;
    title: string;
    url: string;
    price?: number;
    rating?: number;
    reviewsCount?: number;
    categoryId: string;
    sellerName?: string;
    sellerExternalId?: string;
  }) {
    let sellerId: string | undefined;

    if (data.sellerExternalId) {
      const seller = await this.prisma.seller.upsert({
        where: { externalId: data.sellerExternalId },
        update: { name: data.sellerName },
        create: {
          externalId: data.sellerExternalId,
          name: data.sellerName || 'unknown',
        },
      });

      sellerId = seller.id;
    }

    return this.prisma.product.upsert({
      where: { asin: data.asin },
      update: {
        price: data.price,
        rating: data.rating,
        reviewsCount: data.reviewsCount ?? undefined,
        categoryId: data.categoryId,
        sellerId,
        lastParsedAt: new Date(),
      },
      create: {
        asin: data.asin,
        title: data.title,
        url: data.url,
        price: data.price,
        rating: data.rating ?? null,
        reviewsCount: data.reviewsCount ?? 0,
        categoryId: data.categoryId,
        sellerId,
      },
    });
  }
}
