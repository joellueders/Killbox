import { chromium } from 'playwright';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

let server;
let url = process.env.KILLBOX_URL;
if (!url) {
  const root = path.resolve('src');
  server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
      const relative = pathname === '/' ? 'killbox.html' : pathname.slice(1);
      const file = path.resolve(root, relative);
      if (!file.startsWith(`${root}${path.sep}`) && file !== root) throw new Error('invalid path');
      await stat(file);
      const extension = path.extname(file);
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
      };
      response.setHeader('content-type', contentTypes[extension] || 'application/octet-stream');
      createReadStream(file).pipe(response);
    } catch {
      response.statusCode = 404;
      response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  url = `http://127.0.0.1:${address.port}/killbox.html`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', err => {
  consoleErrors.push(err.message);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const checks = await page.evaluate(() => {
  const byId = id => !!document.getElementById(id);
  return {
    canvas: !!document.querySelector('canvas'),
    hud: byId('ui'),
    hotbar: byId('buildHotbar'),
    guide: byId('guideButton') || byId('guide'),
    startOverlayHidden: document.getElementById('start')?.classList.contains('hidden') ?? false,
    bodyLoaded: document.body.classList.contains('loaded') || document.readyState === 'complete',
  };
});

const failures = [];
if (!checks.canvas) failures.push('missing canvas');
if (!checks.hud) failures.push('missing hud');
if (!checks.hotbar) failures.push('missing hotbar');
if (!checks.bodyLoaded) failures.push('page not fully loaded');
if (consoleErrors.length) failures.push(`console errors: ${consoleErrors.join(' | ')}`);

if (failures.length) {
  console.error('Killbox smoke failed');
  console.error(JSON.stringify({ url, checks, failures }, null, 2));
  await browser.close();
  await new Promise(resolve => server?.close(resolve) ?? resolve());
  process.exit(1);
}

console.log('Killbox smoke passed');
console.log(JSON.stringify({ url, checks }, null, 2));
await browser.close();
await new Promise(resolve => server?.close(resolve) ?? resolve());
