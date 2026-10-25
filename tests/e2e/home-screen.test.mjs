import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Home options show icons, Arabic labels, and child-friendly targets without ads or external links', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const homeSnapshot = await page.evaluate(() => {
      const selectors = ['#start-button', '#continue-button', '#parents-button'];
      const options = selectors.map((selector) => {
        const button = document.querySelector(selector);
        const rect = button?.getBoundingClientRect();
        return {
          id: selector,
          label: button?.textContent?.trim() ?? '',
          hasIcon: Boolean(button?.querySelector('.primary-action-icon')),
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
          hidden: button?.hasAttribute('hidden') ?? false
        };
      });

      return {
        options,
        externalLinks: document.querySelectorAll('a[href^="http"], iframe, [data-ad], [data-ads]').length
      };
    });

    assert.equal(homeSnapshot.externalLinks, 0);

    const visibleOptions = homeSnapshot.options.filter((option) => !option.hidden);
    assert.equal(visibleOptions.length, 2);
    assert.ok(visibleOptions.every((option) => option.label.length > 0));
    assert.ok(visibleOptions.every((option) => option.hasIcon));
    assert.ok(visibleOptions.every((option) => option.width >= 110));
    assert.ok(visibleOptions.every((option) => option.height >= 44));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Selecting Play opens the first available level', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=level-002`, { waitUntil: 'networkidle' });

    const beforePlay = await page.evaluate(() => ({
      cellCount: document.querySelectorAll('#world-grid .cell').length,
      indicator: document.querySelector('#level-indicator')?.textContent?.trim() ?? ''
    }));

    assert.equal(beforePlay.cellCount, 25);
    assert.match(beforePlay.indicator, /2\/3/);

    await page.click('#start-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('1/3'));

    const afterPlay = await page.evaluate(() => ({
      cellCount: document.querySelectorAll('#world-grid .cell').length,
      indicator: document.querySelector('#level-indicator')?.textContent?.trim() ?? ''
    }));

    assert.equal(afterPlay.cellCount, 16);
    assert.match(afterPlay.indicator, /1\/3/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Continue is shown when progress exists and opens the saved level', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.progress.levelId', 'level-002');
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const continueVisible = await page.evaluate(() => {
      const button = document.querySelector('#continue-button');
      return Boolean(button) && !button.hasAttribute('hidden');
    });
    assert.equal(continueVisible, true);

    await page.click('#continue-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('2/3'));

    const continuedLevelSnapshot = await page.evaluate(() => ({
      cellCount: document.querySelectorAll('#world-grid .cell').length,
      indicator: document.querySelector('#level-indicator')?.textContent?.trim() ?? ''
    }));

    assert.equal(continuedLevelSnapshot.cellCount, 25);
    assert.match(continuedLevelSnapshot.indicator, /2\/3/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
