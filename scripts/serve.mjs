import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, normalize, resolve } from 'node:path';

const projectRootPath = resolve('.');
const fallbackIndexPath = resolve(projectRootPath, 'index.html');
const host = '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.woff2', 'font/woff2']
]);

function resolveRequestPath(requestUrl) {
  const rawPath = requestUrl?.split('?')[0] ?? '/';
  const decodedPath = decodeURIComponent(rawPath);
  if (decodedPath === '/') {
    return fallbackIndexPath;
  }

  const normalizedRelativePath = normalize(decodedPath).replace(/^([/\\])+/, '');
  const absolutePath = resolve(projectRootPath, normalizedRelativePath);
  if (!absolutePath.startsWith(projectRootPath)) {
    return null;
  }

  return absolutePath;
}

async function pickResponsePath(requestPath) {
  if (!requestPath) {
    return null;
  }

  try {
    const fileStat = await stat(requestPath);
    if (fileStat.isFile()) {
      return requestPath;
    }
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return fallbackIndexPath;
    }
    throw error;
  }

  return fallbackIndexPath;
}

const server = createServer(async (request, response) => {
  try {
    const requestPath = resolveRequestPath(request.url);
    if (requestPath === null) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    const responsePath = await pickResponsePath(requestPath);
    if (!responsePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    const fileExtension = extname(responsePath).toLowerCase();
    const contentType = mimeTypes.get(fileExtension) ?? 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });

    const stream = createReadStream(responsePath);
    stream.on('error', (error) => {
      console.error('Failed to stream response file.', error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
    });
    stream.pipe(response);
  } catch (error) {
    console.error('Failed to serve request.', error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set a different port with PORT=<value> npm start.`);
    process.exit(1);
  }

  console.error('Failed to start local server.', error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`MiniBot Studio is running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop.');
});
