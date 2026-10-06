// Fetches the app repo's docs folder into .content/ (gitignored).
//
//   DOCS_REPO        owner/name of the app repo        (default luca-ramseyer/raml-kql)
//   DOCS_REF         branch, tag or ref                 (default main)
//   DOCS_PATH        docs folder inside that repo       (default docs)
//   DOCS_LOCAL_PATH  use a local folder instead         (e.g. ../raml-kql/docs)
//
// Writes .content/meta.json (read by the site) and mirrors non-Markdown files
// (images) to public/docs-assets/ so rewritten image URLs resolve.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const content = join(root, '.content');
const assetsOut = join(root, 'public', 'docs-assets');

const repo = process.env.DOCS_REPO || 'luca-ramseyer/raml-kql';
const ref = process.env.DOCS_REF || 'main';
const path = (process.env.DOCS_PATH || 'docs').replace(/^\/+|\/+$/g, '');
const local = process.env.DOCS_LOCAL_PATH;

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } });

let docsDir;
if (local) {
  docsDir = resolve(root, local);
  if (!existsSync(docsDir)) throw new Error(`DOCS_LOCAL_PATH does not exist: ${docsDir}`);
  console.log(`[docs] using local folder ${docsDir}`);
} else {
  const clone = join(content, 'repo');
  rmSync(clone, { recursive: true, force: true });
  mkdirSync(content, { recursive: true });
  const url = `https://github.com/${repo}.git`;
  console.log(`[docs] cloning ${url}@${ref} (sparse: ${path}/)`);
  git(['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', '--branch', ref, url, clone]);
  git(['sparse-checkout', 'set', path], clone);
  docsDir = join(clone, path);
  if (!existsSync(docsDir)) throw new Error(`${repo}@${ref} has no "${path}/" folder`);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.git')) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

rmSync(assetsOut, { recursive: true, force: true });
let md = 0;
let assets = 0;
for (const file of walk(docsDir)) {
  const rel = file.slice(docsDir.length + 1);
  if (/\.mdx?$/i.test(file)) { md++; continue; }
  mkdirSync(dirname(join(assetsOut, rel)), { recursive: true });
  copyFileSync(file, join(assetsOut, rel));
  assets++;
}

mkdirSync(content, { recursive: true });
writeFileSync(
  join(content, 'meta.json'),
  JSON.stringify({ repo, ref, path, docsDir, local: Boolean(local) }, null, 2),
);
console.log(`[docs] ${md} Markdown files, ${assets} assets`);
