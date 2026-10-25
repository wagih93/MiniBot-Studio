import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Unexpected runtime errors show a friendly status and are logged through the logger port', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      const syntheticError = new Error('Synthetic stack trace marker');
      window.dispatchEvent(new ErrorEvent('error', { error: syntheticError }));
    });

    await page.waitForSelector('#status[data-state="unexpectedError"]');

    const snapshot = await page.evaluate(() => ({
      statusText: document.querySelector('#status')?.textContent?.trim() ?? '',
      logs: window.__runtimeLogEntries ?? []
    }));

    assert.match(snapshot.statusText, /خطأ غير متوقع/);
    assert.doesNotMatch(snapshot.statusText, /Synthetic stack trace marker/);
    assert.equal(snapshot.logs.length > 0, true);
    assert.equal(snapshot.logs.at(-1)?.entry?.code, 'runtime.unexpected');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
