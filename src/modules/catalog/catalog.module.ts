import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [CatalogService, PrismaService],
  exports: [CatalogService],
})
export class CatalogModule {}
