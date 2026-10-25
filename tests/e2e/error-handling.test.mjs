import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Level errors show friendly Arabic retry options without exposing technical details', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=broken-level`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#level-error:not([hidden])');

    const errorSnapshot = await page.evaluate(() => ({
      message: document.querySelector('#level-error-message')?.textContent?.trim() ?? '',
      retryLabel: document.querySelector('#retry-level-button')?.textContent?.trim() ?? '',
      homeLabel: document.querySelector('#return-home-button')?.textContent?.trim() ?? '',
      status: document.querySelector('#status')?.textContent?.trim() ?? ''
    }));

    assert.match(errorSnapshot.message, /تعذّر فتح هذا المستوى/);
    assert.match(errorSnapshot.retryLabel, /حاول مرة أخرى/);
    assert.match(errorSnapshot.homeLabel, /العودة للرئيسية/);
    assert.match(errorSnapshot.status, /تم تحميل مستوى آمن/);
    assert.equal(/TypeError|ReferenceError|stack|Exception/i.test(errorSnapshot.message), false);

    await page.click('#retry-level-button');
    await page.waitForSelector('#status[data-state="fallback"]');

    await page.click('#return-home-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('1/3'));
    const isErrorPanelHidden = await page.evaluate(() => document.querySelector('#level-error')?.hasAttribute('hidden'));
    assert.equal(isErrorPanelHidden, true);
    const runtimeLogs = await page.evaluate(() => window.__runtimeLogEntries ?? []);
    assert.ok(
      runtimeLogs.some((entry) =>
        entry.level === 'warn' &&
        entry.entry?.message === 'Level validation failed.'
      )
    );
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
