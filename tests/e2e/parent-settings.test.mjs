import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Parent settings open separately and closing them keeps saved progress', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.progress.levelId', 'level-002');
    window.localStorage.setItem('minibot.progress.completedLevelIds.v1', JSON.stringify(['level-001']));
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-003`, { waitUntil: 'networkidle' });
    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');

    const parentAreaSnapshot = await page.evaluate(() => ({
      personalInputCount: document.querySelectorAll(
        '#parent-area input[type="text"], #parent-area input[type="email"], #parent-area input[type="password"], #parent-area textarea'
      ).length,
      levelIndicator: document.querySelector('#level-indicator')?.textContent?.trim() ?? ''
    }));
    assert.equal(parentAreaSnapshot.personalInputCount, 0);
    assert.match(parentAreaSnapshot.levelIndicator, /3\/5/);

    await page.click('#close-parent-area-button');
    await page.waitForSelector('#parent-area[hidden]');
    await page.click('#continue-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('2/5'));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Parent settings can disable and enable sound effects with persistence', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');

    const defaultToggleState = await page.evaluate(() => {
      return document.querySelector('#sound-effects-toggle')?.checked ?? false;
    });
    assert.equal(defaultToggleState, true);

    await page.click('#sound-effects-toggle');
    await page.waitForSelector('#status[data-state="soundEffectsDisabled"]');

    const disabledSnapshot = await page.evaluate(() => ({
      storageValue: window.localStorage.getItem('minibot.settings.soundEffectsEnabled')
    }));
    assert.equal(disabledSnapshot.storageValue, 'false');

    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');

    const persistedToggleState = await page.evaluate(() => {
      return document.querySelector('#sound-effects-toggle')?.checked ?? true;
    });
    assert.equal(persistedToggleState, false);

    await page.click('#sound-effects-toggle');
    await page.waitForSelector('#status[data-state="soundEffectsEnabled"]');
    const reenabledStorageValue = await page.evaluate(() => window.localStorage.getItem('minibot.settings.soundEffectsEnabled'));
    assert.equal(reenabledStorageValue, 'true');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Parent settings remain reachable after level completion', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    const primaryActionsSnapshot = await page.evaluate(() => ({
      startDisabled: document.querySelector('#start-button')?.hasAttribute('disabled') ?? true,
      continueDisabled: document.querySelector('#continue-button')?.hasAttribute('disabled') ?? true,
      parentsDisabled: document.querySelector('#parents-button')?.hasAttribute('disabled') ?? true
    }));
    assert.equal(primaryActionsSnapshot.startDisabled, false);
    assert.equal(primaryActionsSnapshot.continueDisabled, false);
    assert.equal(primaryActionsSnapshot.parentsDisabled, false);

    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
