import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 }
];

test('Arabic shell uses RTL and stays readable across supported viewports', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

      const metadata = await page.evaluate(() => {
        const directionIcons = Array.from(document.querySelectorAll('.direction-icon')).map((iconElement) => ({
          text: iconElement.textContent?.trim(),
          direction: window.getComputedStyle(iconElement).direction
        }));

        const clippingTargets = [
          '#app-heading',
          '#level-indicator',
          '#status',
          '.primary-actions',
          '.controls',
          '.movement-guide'
        ];

        const hasClipping = clippingTargets.some((selector) => {
          const element = document.querySelector(selector);
          if (!element) {
            return true;
          }
          const rect = element.getBoundingClientRect();
          return rect.width <= 0 || rect.height <= 0;
        });

        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          heading: document.querySelector('#app-heading')?.textContent?.trim(),
          levelIndicator: document.querySelector('#level-indicator')?.textContent?.trim(),
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          directionIcons,
          hasClipping
        };
      });

      assert.equal(metadata.lang, 'ar');
      assert.equal(metadata.dir, 'rtl');
      assert.ok(metadata.heading && metadata.heading.length > 0);
      assert.match(metadata.levelIndicator ?? '', /1\/\d+/);
      assert.equal(metadata.horizontalOverflow, false);
      assert.equal(metadata.hasClipping, false);
      assert.deepEqual(
        metadata.directionIcons.map((icon) => icon.text),
        ['↑', '→', '←']
      );
      assert.ok(metadata.directionIcons.every((icon) => icon.direction === 'ltr'));

      await context.close();
    }
  } finally {
    await browser.close();
    await closeServer(server);
  }
});

