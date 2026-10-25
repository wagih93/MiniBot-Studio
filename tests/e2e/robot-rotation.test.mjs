import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Turn commands rotate robot orientation without changing position', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await page.click('#block-turnRight');
    await page.click('#play-button');
    await page.waitForSelector('#world-grid .robot.rotating-right');
    await page.waitForSelector('#status[data-state="complete"]');

    const afterRightTurn = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .robot');
      return {
        row: robotCell?.getAttribute('data-row'),
        column: robotCell?.getAttribute('data-column'),
        direction: robotCell?.getAttribute('data-direction')
      };
    });
    assert.deepEqual(afterRightTurn, { row: '0', column: '0', direction: 'south' });

    await page.click('#block-turnLeft');
    await page.click('#play-button');
    await page.waitForSelector('#world-grid .robot.rotating-left');
    await page.waitForSelector('#status[data-state="complete"]');

    const afterLeftTurn = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .robot');
      return {
        row: robotCell?.getAttribute('data-row'),
        column: robotCell?.getAttribute('data-column'),
        direction: robotCell?.getAttribute('data-direction')
      };
    });
    assert.deepEqual(afterLeftTurn, { row: '0', column: '0', direction: 'east' });
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

