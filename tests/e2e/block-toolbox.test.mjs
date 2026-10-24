import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Block toolbox shows only level-allowed blocks', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=level-collect`, { waitUntil: 'networkidle' });

    const blockIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#block-list .block-item')).map((item) => item.id)
    );

    assert.deepEqual(blockIds, ['block-moveForward']);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Toolbox blocks include icons, Arabic labels, and touch-friendly non-color distinctions', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const blockSnapshot = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#block-list .block-item')).map((item) => {
        const rect = item.getBoundingClientRect();
        const icon = item.querySelector('.block-item__icon');
        const label = item.querySelector('.block-item__label');
        return {
          id: item.id,
          label: label?.textContent?.trim() ?? '',
          icon: icon?.textContent?.trim() ?? '',
          borderStyle: window.getComputedStyle(item).borderStyle,
          width: rect.width,
          height: rect.height
        };
      })
    );

    assert.equal(blockSnapshot.length, 3);
    assert.ok(blockSnapshot.every((block) => block.label.length > 0));
    assert.ok(blockSnapshot.every((block) => block.icon.length > 0));
    assert.ok(blockSnapshot.every((block) => block.width >= 110));
    assert.ok(blockSnapshot.every((block) => block.height >= 44));

    const uniqueIcons = new Set(blockSnapshot.map((block) => block.icon));
    const uniqueBorderStyles = new Set(blockSnapshot.map((block) => block.borderStyle));
    assert.ok(uniqueIcons.size >= 3);
    assert.ok(uniqueBorderStyles.size >= 2);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
