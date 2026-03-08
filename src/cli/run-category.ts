import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QueueHandler } from '../modules/queue-handler/queue.handler';

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: yarn parse:category <categoryId> <categoryUrl>');
    process.exit(1);
  }

  const [categoryId, categoryUrl] = args;
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const handler = app.get(QueueHandler);
    console.log(`🚀 Начинаем парсинг категории: ${categoryId}...`);

    await handler.processCategory(categoryId, categoryUrl);

    console.log('✅ Парсинг успешно завершен!');
  } catch (error) {
    console.error('❌ Ошибка во время работы скрипта:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

run();
