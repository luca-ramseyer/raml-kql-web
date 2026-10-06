// Remark plugin for docs pages:
//  - removes the first H1 (the layout renders the page title)
//  - rewrites relative links between docs (./query-packs.md -> /docs/query-packs/)
//  - rewrites relative images / assets to /docs-assets/... (mirrored by scripts/fetch-docs.mjs)
//  - turns links that leave docs/ into GitHub URLs in the app repo
import { posix, relative, resolve, sep } from 'node:path';
import { visit, SKIP } from 'unist-util-visit';
import { docSlug } from './slug.mjs';

const isExternal = (u) => /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);

export default function remarkDocs({ docsDir, repo, ref, path: repoPath, base = '/' }) {
  const prefix = base.replace(/\/$/, '');
  return (tree, file) => {
    const abs = resolve(file.path || '');
    const fromRoot = docsDir ? relative(docsDir, abs).split(sep).join('/') : '';
    const fromDir = posix.dirname(fromRoot);

    let h1Removed = false;
    visit(tree, 'heading', (node, index, parent) => {
      if (!h1Removed && node.depth === 1 && parent && index !== undefined) {
        h1Removed = true;
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
    });

    const fix = (node, kind) => {
      const url = node.url;
      if (!url || isExternal(url)) return;
      const m = url.match(/^([^?#]*)([?#].*)?$/);
      const target = m[1];
      const tail = m[2] || '';
      const resolved = posix.normalize(posix.join(fromDir, target));
      if (resolved.startsWith('..')) {
        // Leaves docs/: point at the file in the app repo, relative to the repo root.
        const inRepo = posix.normalize(posix.join(repoPath, fromDir, target));
        const isDir = target.endsWith('/') || !posix.extname(target);
        const host = kind === 'image' ? `https://raw.githubusercontent.com/${repo}/${ref}/` : `https://github.com/${repo}/${isDir ? 'tree' : 'blob'}/${ref}/`;
        node.url = host + inRepo.replace(/\/$/, '') + tail;
        return;
      }
      if (/\.mdx?$/i.test(target)) {
        const s = docSlug(resolved);
        node.url = `${prefix}/docs/${s === 'index' ? '' : s + '/'}${tail}`;
      } else {
        node.url = `${prefix}/docs-assets/${resolved}${tail}`;
      }
    };

    visit(tree, 'link', (n) => fix(n, 'link'));
    visit(tree, 'image', (n) => fix(n, 'image'));
  };
}
