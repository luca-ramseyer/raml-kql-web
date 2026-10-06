import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { unified } from '@astrojs/markdown-remark';
import remarkDocs from './src/lib/remark-docs.mjs';
import ramlTheme from './src/shiki/raml-theme.json' with { type: 'json' };

// Deployment is configured by env vars so that moving hosts (GitHub Pages -> Vercel)
// is a config change, not a code change.
const site = process.env.SITE_URL || 'https://kql.raml.ch';
const base = process.env.SITE_BASE || '/';

let docs = { repo: 'luca-ramseyer/raml-kql', ref: 'main', path: 'docs', docsDir: '' };
try {
  docs = JSON.parse(readFileSync(new URL('./.content/meta.json', import.meta.url), 'utf8'));
} catch {
  // .content/ is created by scripts/fetch-docs.mjs (npm run fetch)
}

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: ramlTheme, wrap: false },
    processor: unified({
      smartypants: false,
      remarkPlugins: [[remarkDocs, { docsDir: docs.docsDir, repo: docs.repo, ref: docs.ref, path: docs.path, base }]],
    }),
  },
});
