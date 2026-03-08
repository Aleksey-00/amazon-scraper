import { Injectable, Logger } from '@nestjs/common';
import type { BrowserContext, Page, Browser } from 'playwright';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

export interface ParsedProduct {
  asin: string;
  title: string;
  url: string;
  price?: number;
  rating?: number;
  reviewsCount?: number;
  sellerName?: string;
  sellerExternalId?: string;
}

export interface ParsedReview {
  externalId: string;
  authorName?: string;
  rating: number;
  title?: string;
  text: string;
  isVerified: boolean;
  date: Date;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  private async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const browser = (await (chromium as any).launch({
      headless: true,
    })) as unknown as Browser;

    const context: BrowserContext = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    });

    const page: Page = await context.newPage();

    try {
      return await fn(page);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Scraping error: ${error.message}`);
      throw error;
    } finally {
      await context.close();
      await browser.close();
    }
  }

  private static readonly GOTO_OPTIONS = {
    waitUntil: 'domcontentloaded' as const,
    timeout: 30_000,
  };

  async fetchAsinsFromCategory(categoryUrl: string): Promise<string[]> {
    this.logger.log(`Fetching ASINs from category: ${categoryUrl}`);

    return await this.withPage(async (page) => {
      const maxTries = 2;
      for (let tryNum = 1; tryNum <= maxTries; tryNum++) {
        try {
          await page.goto(categoryUrl, ScraperService.GOTO_OPTIONS);
          break;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            tryNum < maxTries &&
            (msg.includes('ERR_CONNECTION_RESET') || msg.includes('net::ERR_'))
          ) {
            this.logger.warn(`Retry ${tryNum}/${maxTries} after ${msg}`);
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          throw err;
        }
      }

      const asins = await page.$$eval('div[data-asin]', (elements) =>
        elements
          .map((el) => el.getAttribute('data-asin'))
          .filter((asin): asin is string => !!asin && asin.length > 0),
      );

      const uniqueAsins = [...new Set(asins)];
      this.logger.log(`Found ${uniqueAsins.length} ASINs`);
      if (uniqueAsins.length === 0) {
        this.logger.warn(
          'No products found. Use a category or search URL that lists products, e.g. https://www.amazon.com/s?k=headphones',
        );
      }
      return uniqueAsins;
    });
  }

  async parseProductDetails(asin: string): Promise<ParsedProduct> {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    this.logger.log(`Parsing product details: ${asin}`);

    return this.withPage(async (page) => {
      await page.goto(productUrl, ScraperService.GOTO_OPTIONS);

      const title = await page
        .locator('#productTitle')
        .innerText()
        .then((t) => t.trim())
        .catch(() => 'No Title');
      const priceText = await page
        .locator('span.a-price span.a-offscreen')
        .first()
        .innerText()
        .catch(() => undefined);

      const sellerInfo = await page
        .evaluate(() => {
          const sellerLink = document.querySelector<HTMLAnchorElement>(
            '#sellerProfileTriggerId, a[href*="seller="]',
          );
          if (!sellerLink) return null;
          const name = sellerLink.textContent?.trim() || undefined;
          const href = sellerLink.getAttribute('href') || '';
          const m = href.match(/seller=([A-Z0-9]+)/i);
          const externalIdFromUrl = m ? m[1] : undefined;
          const externalId =
            externalIdFromUrl ||
            (name
              ? `name_${name.replace(/\W/g, '_').slice(0, 40)}`
              : undefined);
          if (!externalId) return null;
          return {
            sellerName: name || 'Unknown',
            sellerExternalId: externalId,
          };
        })
        .catch(() => null);

      return {
        asin,
        title,
        url: productUrl,
        price: priceText
          ? Number(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'))
          : undefined,
        sellerName: sellerInfo?.sellerName,
        sellerExternalId: sellerInfo?.sellerExternalId,
      };
    });
  }

  async parseReviews(asin: string): Promise<ParsedReview[]> {
    const reviewsUrl = `https://www.amazon.com/product-reviews/${asin}`;
    this.logger.log(`Parsing reviews for ASIN: ${asin}`);

    return this.withPage(async (page) => {
      await page.goto(reviewsUrl, ScraperService.GOTO_OPTIONS);

      return await page.$$eval('[data-hook="review"]', (elements) =>
        elements.map((el) => {
          const id = el.getAttribute('id') || '';
          const text = el.querySelector(
            '[data-hook="review-body"] span',
          )?.textContent;
          const ratingText = el.querySelector(
            '[data-hook="review-star-rating"] span.a-icon-alt',
          )?.textContent;
          const authorEl = el.querySelector('[data-hook="review-author"]');
          const authorName =
            authorEl?.textContent?.trim().replace(/^\s*By\s*/i, '') ||
            undefined;
          const dateEl = el.querySelector('[data-hook="review-date"]');
          const dateText = dateEl?.textContent?.trim();
          let date = new Date();
          if (dateText) {
            const parsed = new Date(dateText);
            if (!isNaN(parsed.getTime())) date = parsed;
          }

          return {
            externalId: id,
            rating: ratingText ? Math.round(parseFloat(ratingText)) : 0,
            text: text?.trim() || '',
            isVerified: !!el.querySelector('[data-hook="avp-badge"]'),
            date,
            authorName,
          };
        }),
      );
    });
  }
}
