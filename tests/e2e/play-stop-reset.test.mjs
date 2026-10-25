import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Play starts execution and keeps a single active run', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-002&repeat=3&stepDelayMs=80&maxSteps=20`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.evaluate(() => document.querySelector('#play-button')?.click());

    const runningSnapshot = await page.evaluate(() => ({
      playDisabled: document.querySelector('#play-button')?.hasAttribute('disabled') ?? false,
      blockDisabled: document.querySelector('#block-moveForward')?.hasAttribute('disabled') ?? false
    }));

    assert.equal(runningSnapshot.playDisabled, true);
    assert.equal(runningSnapshot.blockDisabled, true);

    await page.waitForSelector('#status[data-state="complete"]');

    const finalSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      playDisabled: document.querySelector('#play-button')?.hasAttribute('disabled') ?? true,
      blockDisabled: document.querySelector('#block-moveForward')?.hasAttribute('disabled') ?? true
    }));

    assert.equal(finalSnapshot.robotColumn, '3');
    assert.equal(finalSnapshot.playDisabled, false);
    assert.equal(finalSnapshot.blockDisabled, false);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Stop cancels pending movement and future actions', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-002&repeat=10&stepDelayMs=80&maxSteps=20`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.click('#stop-button');
    await page.waitForSelector('#status[data-state="stopped"]');

    const stoppedSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? ''
    }));

    await page.waitForTimeout(250);

    const afterStopSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      status: document.querySelector('#status')?.getAttribute('data-state') ?? ''
    }));

    assert.equal(afterStopSnapshot.robotColumn, stoppedSnapshot.robotColumn);
    assert.equal(afterStopSnapshot.status, 'stopped');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Reset restores robot position and collectibles to initial level state', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-collect`, { waitUntil: 'networkidle' });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    const resetSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      collectionSummary: document.querySelector('#collection-summary')?.textContent?.trim() ?? '',
      uncollectedTargets: document.querySelectorAll('#world-grid .target').length
    }));

    assert.equal(resetSnapshot.robotColumn, '0');
    assert.match(resetSnapshot.collectionSummary, /0\/1/);
    assert.equal(resetSnapshot.uncollectedTargets, 1);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

