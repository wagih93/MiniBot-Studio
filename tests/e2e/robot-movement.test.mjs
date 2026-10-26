import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Move forward animates one step, blocks at walls, and keeps state synchronized', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#world-grid .robot.moving-east');
    await page.waitForFunction(() => {
      const state = document.querySelector('#status')?.getAttribute('data-state');
      return state === 'complete' || state === 'levelComplete';
    });

    const firstMovePosition = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .robot');
      return {
        row: robotCell?.getAttribute('data-row'),
        column: robotCell?.getAttribute('data-column')
      };
    });
    assert.deepEqual(firstMovePosition, { row: '0', column: '1' });

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="blocked"]');

    const blockedPosition = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .robot');
      return {
        row: robotCell?.getAttribute('data-row'),
        column: robotCell?.getAttribute('data-column'),
        statusText: document.querySelector('#status')?.textContent?.trim() ?? ''
      };
    });

    assert.deepEqual(
      { row: blockedPosition.row, column: blockedPosition.column },
      { row: '0', column: '1' }
    );
    assert.match(blockedPosition.statusText, /عائق/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
