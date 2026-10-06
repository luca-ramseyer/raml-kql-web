// Fetches the latest release of the app repo at build time -> .content/release.json.
// Never fails the build: on any error the site falls back to a link to the releases page.
// GITHUB_TOKEN is optional (raises the API rate limit).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const repo = process.env.DOCS_REPO || 'luca-ramseyer/raml-kql';
const out = join(root, '.content', 'release.json');
mkdirSync(join(root, '.content'), { recursive: true });

let release = null;
try {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'raml-kql-web' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const r = await res.json();
  release = {
    version: String(r.tag_name).replace(/^v/, ''),
    tag: r.tag_name,
    url: r.html_url,
    publishedAt: r.published_at,
    assets: r.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
  };
  console.log(`[release] ${repo} ${r.tag_name} (${release.assets.length} assets)`);
} catch (e) {
  console.warn(`[release] could not fetch latest release (${e.message}); using fallback links`);
}
writeFileSync(out, JSON.stringify(release));
