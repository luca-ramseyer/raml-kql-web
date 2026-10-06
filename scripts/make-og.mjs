// Renders public/og.png (1200x630) and public/apple-touch-icon.png. Run manually: npm run og
// Needs a Chromium: set CHROMIUM_PATH, or it tries the Playwright default location.
// Fonts load from Google Fonts, so the wordmark uses the real Cormorant Garamond.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fonts = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Montserrat:wght@400&display=swap';
const icon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');

const og = `<!doctype html><link rel="stylesheet" href="${fonts}"><style>
  body{margin:0;width:1200px;height:630px;background:#F4EFE4;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .w{font:500 96px/1 'Cormorant Garamond',serif;letter-spacing:.24em;margin-right:-.24em;text-transform:uppercase;color:#211F1C}
  .t{margin-top:40px;font:400 22px/1 Montserrat,sans-serif;letter-spacing:.14em;color:#423D37}
  .t i{color:#C0473A;font-style:normal;padding:0 .6em}
</style><p class="w" style="margin-bottom:0">Raml KQL</p>
<p class="t">Multi-tenant<i>·</i>KQL<i>·</i>Open source</p>`;

const touch = `<!doctype html><style>body{margin:0;width:180px;height:180px;background:#F4EFE4;display:grid;place-items:center}svg{width:132px;height:132px}</style>${icon}`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [html, file, w, h] of [[og, 'og.png', 1200, 630], [touch, 'apple-touch-icon.png', 180, 180]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, 'public', file) });
  console.log('wrote public/' + file);
}
await browser.close();
