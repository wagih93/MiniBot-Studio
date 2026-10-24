import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Robot world, block area, and controls remain visible and support mouse and touch', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();

  try {
    const mouseContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const mousePage = await mouseContext.newPage();
    await mousePage.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const visibility = await mousePage.evaluate(() => {
      const requiredSelectors = ['#robot-world', '#block-area', '.controls'];
      const hiddenSelectors = requiredSelectors.filter((selector) => {
        const element = document.querySelector(selector);
        if (!element) {
          return true;
        }
        const rect = element.getBoundingClientRect();
        return rect.width <= 0 || rect.height <= 0;
      });

      const hasHoverOnlyHandlers =
        document.querySelectorAll('[onmouseover], [onmouseenter], [onmouseleave]').length > 0;
      const controlsGap = Number.parseFloat(window.getComputedStyle(document.querySelector('.controls')).gap || '0');
      const hasHorizontalOverflow =
        document.documentElement.scrollWidth > document.documentElement.clientWidth;

      return {
        hiddenSelectors,
        hasHoverOnlyHandlers,
        controlsGap,
        hasHorizontalOverflow
      };
    });

    assert.deepEqual(visibility.hiddenSelectors, []);
    assert.equal(visibility.hasHoverOnlyHandlers, false);
    assert.equal(visibility.hasHorizontalOverflow, false);
    assert.ok(visibility.controlsGap >= 8);

    await mousePage.click('#play-button');
    await mousePage.waitForSelector('#status[data-state="complete"]');
    await mousePage.click('#block-moveForward');
    await mousePage.waitForSelector('#block-moveForward[data-selected="true"]');

    await mouseContext.close();

    const touchContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      hasTouch: true,
      isMobile: true
    });
    const touchPage = await touchContext.newPage();
    await touchPage.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
    await touchPage.tap('#play-button');
    await touchPage.waitForSelector('#status[data-state="complete"]');
    await touchPage.tap('#stop-button');
    await touchPage.waitForSelector('#status[data-state="stopped"]');
    await touchPage.tap('#block-turnRight');
    await touchPage.waitForSelector('#block-turnRight[data-selected="true"]');
    await touchPage.tap('#reset-button');
    await touchPage.waitForSelector('#status[data-state="reset"]');

    await touchContext.close();
  } finally {
    await browser.close();
    await closeServer(server);
  }
});
