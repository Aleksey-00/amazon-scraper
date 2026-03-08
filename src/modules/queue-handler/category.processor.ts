import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueHandler } from './queue.handler';

interface CategoryJobData {
  categoryId: string;
  categoryUrl: string;
}

@Processor('category')
export class CategoryProcessor extends WorkerHost {
  constructor(private readonly handler: QueueHandler) {
    super();
  }

  async process(job: Job<CategoryJobData>): Promise<void> {
    if (job.name !== 'parse-category') {
      return;
    }

    const { categoryId, categoryUrl } = job.data;
    await this.handler.processCategory(categoryId, categoryUrl);
  }
}
