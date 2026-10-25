import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Invalid level data triggers safe fallback instead of crash', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=broken-level`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="fallback"]');

    const fallbackData = await page.evaluate(() => ({
      status: document.querySelector('#status')?.textContent?.trim() ?? '',
      cellCount: document.querySelectorAll('#world-grid .cell').length,
      blockCount: document.querySelectorAll('#block-list .block-item').length
    }));

    assert.match(fallbackData.status, /بيانات المستوى غير صالحة/);
    assert.ok(fallbackData.cellCount > 0);
    assert.ok(fallbackData.blockCount > 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

