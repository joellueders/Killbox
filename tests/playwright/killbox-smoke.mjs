import { chromium } from 'playwright';

const url = process.env.KILLBOX_URL || 'http://127.0.0.1:4173/killbox.html';

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
  process.exit(1);
}

console.log('Killbox smoke passed');
console.log(JSON.stringify({ url, checks }, null, 2));
await browser.close();
