import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const rootDirectory = resolve('.');

const contentTypeByExtension = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8'
};

function createStaticServer() {
  return createServer(async (request, response) => {
    const requestPath = request.url === '/' ? '/index.html' : request.url;
    const filePath = join(rootDirectory, requestPath.replace(/^\//, ''));

    try {
      const fileContent = await readFile(filePath);
      const contentType = contentTypeByExtension[extname(filePath)] ?? 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType });
      response.end(fileContent);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

test('Robot Lab session blocks non-local network requests', async () => {
  const server = createStaticServer();
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
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
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');
    await page.click('#stop-button');
    await page.click('#reset-button');

    assert.deepEqual(externalRequests, []);
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }
        resolvePromise();
      });
    });
  }
});
