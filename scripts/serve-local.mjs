import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const relative = pathname === '/' ? 'killbox.html' : pathname.slice(1);
    const file = path.resolve(root, relative);
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) throw new Error('invalid path');
    await stat(file);
    res.setHeader('content-type', contentTypes[path.extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  console.log(`Serving at http://127.0.0.1:${port}/killbox.html`);
});
