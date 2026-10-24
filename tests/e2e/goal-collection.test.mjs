import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Star collection is tracked once and completion uses level success conditions', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=level-collect`, { waitUntil: 'networkidle' });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="collected"]');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    const afterFirstCollection = await page.evaluate(() => ({
      summary: document.querySelector('#collection-summary')?.textContent?.trim() ?? '',
      collectedTargets: document.querySelectorAll('#world-grid .target-collected').length
    }));

    assert.match(afterFirstCollection.summary, /1\/1/);
    assert.equal(afterFirstCollection.collectedTargets, 0);

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="blocked"]');

    const afterSecondAttempt = await page.evaluate(() => ({
      summary: document.querySelector('#collection-summary')?.textContent?.trim() ?? '',
      status: document.querySelector('#status')?.textContent?.trim() ?? ''
    }));

    assert.match(afterSecondAttempt.summary, /1\/1/);
    assert.match(afterSecondAttempt.status, /عائق/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
