// Builds web-sized copies of the landing-page screenshots into public/shots/ (gitignored).
// Source, in order of preference:
//   1. public/screenshots/<name>.png   (your own override)
//   2. the app repo's docs/images/ (fetched by fetch-docs.mjs, mirrored in public/docs-assets/images/)
import sharp from 'sharp';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'public', 'shots');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const shots = {
  app: 'images/results-dark.png',
  chart: 'images/chart.png',
};

const manifest = {};
for (const [name, docsRel] of Object.entries(shots)) {
  const candidates = [join(root, 'public', 'screenshots', `${name}.png`), join(root, 'public', 'docs-assets', docsRel)];
  const src = candidates.find(existsSync);
  if (!src) { console.warn(`[shots] no source for "${name}"`); continue; }
  const { width, height } = await sharp(src).metadata();
  const widths = [800, 1600].filter((w) => w <= width);
  for (const w of widths) await sharp(src).resize({ width: w }).webp({ quality: 82 }).toFile(join(out, `${name}-${w}.webp`));
  manifest[name] = { width, height, widths, from: src.includes('screenshots') ? 'override' : 'docs' };
  console.log(`[shots] ${name}: ${widths.join(', ')}w (${manifest[name].from})`);
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest));
