import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async saveBatchReviews(
    productId: string,
    reviews: Array<{
      externalId: string;
      authorName?: string;
      rating: number;
      title?: string;
      text: string;
      isVerified: boolean;
      date: Date;
    }>,
  ) {
    if (!reviews.length) {
      return { count: 0 };
    }

    await this.prisma.$transaction(
      reviews.map((r) =>
        this.prisma.review.upsert({
          where: { externalId: r.externalId },
          update: {
            productId,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            text: r.text,
            isVerified: r.isVerified,
            date: r.date,
          },
          create: {
            externalId: r.externalId,
            productId,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            text: r.text,
            isVerified: r.isVerified,
            date: r.date,
          },
        }),
      ),
    );

    return { count: reviews.length };
  }
}
