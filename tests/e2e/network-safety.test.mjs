import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Robot Lab session blocks non-local network requests', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const externalRequests = [];

  context.on('request', (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
      return;
    }
    const isLocalHost = requestUrl.hostname === '127.0.0.1' || requestUrl.hostname === 'localhost';
    const isLocalPort = requestUrl.port === String(port);
    if (!isLocalHost || !isLocalPort) {
      externalRequests.push(request.url());
    }
  });

  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');
    await page.click('#stop-button');
    await page.click('#reset-button');

    assert.deepEqual(externalRequests, []);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

