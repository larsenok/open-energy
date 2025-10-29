import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const DIST_DIR = resolve('dist');
const PORT = Number(process.env.PORT ?? 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  let filePath = join(DIST_DIR, urlPath);

  if (urlPath.endsWith('/')) {
    filePath = join(DIST_DIR, urlPath, 'index.html');
  }

  if (!existsSync(filePath)) {
    const fallback = join(DIST_DIR, 'index.html');
    if (existsSync(fallback)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      createReadStream(fallback).pipe(response);
      return;
    }
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const stats = statSync(filePath);
  if (stats.isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(response);
});

server.listen(PORT, () => {
  console.log(`Serving dist on http://localhost:${PORT}`);
});
