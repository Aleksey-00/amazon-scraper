import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });
  }

  get product() {
    return this.client.product;
  }
  get review() {
    return this.client.review;
  }
  get category() {
    return this.client.category;
  }
  get seller() {
    return this.client.seller;
  }

  get parsingLog() {
    return this.client.parsingLog;
  }

  get $transaction() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.client.$transaction.bind(this.client);
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
