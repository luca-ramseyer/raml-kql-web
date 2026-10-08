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
import { readFileSync } from 'node:fs';
import YAML from 'yaml';

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

/**
 * One bad frontmatter block must not take the whole site down. Invalid YAML is repaired where it
 * is safe (an unquoted value that contains ": " gets quoted), otherwise the frontmatter is dropped
 * and the page falls back to its first heading. Either way a warning names the file, so it can be
 * fixed at the source. Only our own clone is rewritten, never DOCS_LOCAL_PATH.
 */
function checkFrontmatter(file, rel) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) return;
  const warn = (msg) => console.warn(`::warning file=${path}/${rel},title=Docs frontmatter::${msg}`);
  const valid = (src) => { try { YAML.parse(src); return true; } catch { return false; } };
  if (valid(m[1])) return;
  const quoted = m[1].split('\n').map((line) => {
    const kv = line.match(/^([A-Za-z_][\w-]*):[ \t]+(.+?)[ \t]*$/);
    if (!kv || /^["'\[{|>&*!#]/.test(kv[2]) || !/: |\s#/.test(kv[2])) return line;
    return `${kv[1]}: ${JSON.stringify(kv[2])}`;
  }).join('\n');
  const rest = text.slice(m[0].length);
  if (local) { warn(`Invalid YAML frontmatter in ${rel}. Quote values that contain ": ".`); return; }
  if (valid(quoted)) {
    writeFileSync(file, `---\n${quoted}\n---\n${rest}`);
    warn(`Invalid YAML frontmatter in ${rel} was repaired automatically. Quote values that contain ": " in the source.`);
  } else {
    writeFileSync(file, rest);
    warn(`Invalid YAML frontmatter in ${rel} was ignored. Fix the YAML in the source.`);
  }
}

rmSync(assetsOut, { recursive: true, force: true });
let md = 0;
let assets = 0;
for (const file of walk(docsDir)) {
  const rel = file.slice(docsDir.length + 1);
  if (/\.mdx?$/i.test(file)) { md++; checkFrontmatter(file, rel); continue; }
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
