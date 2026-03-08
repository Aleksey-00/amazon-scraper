declare module 'playwright-extra' {
  import type * as PW from 'playwright';

  export interface PlaywrightExtra extends PW.Playwright {
    chromium: PW.Playwright['chromium'];
    use(plugin: unknown): this;
  }

  const playwrightExtra: PlaywrightExtra;
  export default playwrightExtra;
  export class chromium {
    static use(stealthPlugin: StealthPlugin) {}

    static async launch(param: { headless: boolean }) {
      return undefined;
    }
  }
}
