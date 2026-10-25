import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const contentTypeByExtension = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8'
};

export function createStaticServer(rootDirectory = resolve('.')) {
  return createServer(async (request, response) => {
    const requestTarget = request.url ?? '/';
    const parsedRequestUrl = new URL(requestTarget, 'http://127.0.0.1');
    const requestPath = parsedRequestUrl.pathname === '/' ? '/index.html' : parsedRequestUrl.pathname;
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

export async function listenOnRandomPort(server) {
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  return typeof address === 'object' && address ? address.port : 0;
}

export async function closeServer(server) {
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
