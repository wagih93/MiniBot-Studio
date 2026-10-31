import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

async function runCoreLevel(page) {
  await page.click('#start-button');
  await page.click('#block-moveForward');
  await page.click('#play-button');
  await page.waitForFunction(() => {
    const state = document.querySelector('#status')?.getAttribute('data-state');
    return state === 'complete' || state === 'levelComplete';
  });
}

test('Home screen and core simulation remain playable offline after first load', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.tutorial.completed', '1');
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    await runCoreLevel(page);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#start-button');

    const homeSnapshot = await page.evaluate(() => ({
      heading: document.querySelector('#app-heading')?.textContent?.trim() ?? '',
      levelIndicator: document.querySelector('#level-indicator')?.textContent?.trim() ?? '',
      externalLinks: document.querySelectorAll('a[href^="http"], iframe, [data-ad], [data-ads]').length
    }));

    assert.ok(homeSnapshot.heading.length > 0);
    assert.match(homeSnapshot.levelIndicator, /1\/5/);
    assert.equal(homeSnapshot.externalLinks, 0);

    await runCoreLevel(page);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
