import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Execution limits stop long runs safely and still allow reset', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-002&repeat=10&maxSteps=3&stepDelayMs=1`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="stepLimitExceeded"]');

    const limitedRunSnapshot = await page.evaluate(() => ({
      statusText: document.querySelector('#status')?.textContent?.trim() ?? '',
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      collectionSummary: document.querySelector('#collection-summary')?.textContent?.trim() ?? ''
    }));

    assert.match(limitedRunSnapshot.statusText, /الحد الآمن للخطوات/);
    assert.equal(limitedRunSnapshot.robotColumn, '3');
    assert.match(limitedRunSnapshot.collectionSummary, /0\/1/);

    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    const resetSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      collectionSummary: document.querySelector('#collection-summary')?.textContent?.trim() ?? ''
    }));

    assert.equal(resetSnapshot.robotColumn, '0');
    assert.match(resetSnapshot.collectionSummary, /0\/1/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Stop and reset cancel pending execution timers', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-002&repeat=10&maxSteps=20&stepDelayMs=80`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.click('#stop-button');
    await page.waitForSelector('#status[data-state="stopped"]');

    const stoppedState = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      status: document.querySelector('#status')?.getAttribute('data-state') ?? ''
    }));

    await page.waitForTimeout(250);

    const postStopState = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      status: document.querySelector('#status')?.getAttribute('data-state') ?? ''
    }));

    assert.equal(postStopState.robotColumn, stoppedState.robotColumn);
    assert.equal(postStopState.status, 'stopped');

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    await page.waitForTimeout(250);

    const postResetState = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      status: document.querySelector('#status')?.getAttribute('data-state') ?? ''
    }));

    assert.equal(postResetState.robotColumn, '0');
    assert.equal(postResetState.status, 'reset');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Production entry ignores query parameter execution hooks', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?maxSteps=1&repeat=10&stepDelayMs=1`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');

    const productionSnapshot = await page.evaluate(() => ({
      statusText: document.querySelector('#status')?.textContent?.trim() ?? '',
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? ''
    }));

    assert.doesNotMatch(productionSnapshot.statusText, /الحد الآمن للخطوات/);
    assert.equal(productionSnapshot.robotColumn, '1');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
