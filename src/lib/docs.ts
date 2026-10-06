import { getCollection, type CollectionEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

export type Doc = CollectionEntry<'docs'>;

export interface Meta { repo: string; ref: string; path: string; docsDir: string; local: boolean }
export interface NavItem { title: string; href: string; id: string; order: number }
export interface NavSection { key?: string; title: string; order: number; items: NavItem[]; sections: NavSection[]; href?: string }

const meta: Meta = JSON.parse(readFileSync('./.content/meta.json', 'utf8'));
export const docsMeta = meta;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const docHref = (id: string) => `${base}/docs/${id === 'index' ? '' : id + '/'}`;

const prefixOrder = (name: string): number | undefined => {
  const m = name.match(/^(\d+)[-_ ]/);
  return m ? Number(m[1]) : undefined;
};
const strip = (s: string) => s.replace(/^\d+\s*[-_—–.]\s*/, '').trim();
const titleCase = (s: string) => strip(s).replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Title: frontmatter, else the first H1, else the file name. */
export function docTitle(doc: Doc): string {
  if (doc.data.title) return doc.data.title;
  const h1 = doc.body?.match(/^#\s+(.+?)\s*#*$/m)?.[1];
  const last = doc.id.split('/').pop() ?? doc.id;
  return strip((h1 ?? titleCase(last)).replace(/[`*_]/g, ''));
}

export function docOrder(doc: Doc): number {
  if (doc.data.order !== undefined) return doc.data.order;
  const file = doc.filePath?.split('/').pop() ?? doc.id;
  return prefixOrder(file) ?? 1000;
}

/** Path of the source file relative to the docs root, e.g. "guides/query-packs.md". */
export function sourceRel(doc: Doc): string {
  const abs = resolve(doc.filePath ?? '');
  return relative(meta.docsDir, abs).split(sep).join('/');
}

export const editUrl = (doc: Doc) =>
  `https://github.com/${meta.repo}/edit/${meta.ref}/${meta.path}/${sourceRel(doc)}`;

export async function getDocs(): Promise<Doc[]> {
  return getCollection('docs');
}

/** Build the sidebar tree from the folder structure. */
export function buildNav(docs: Doc[]): NavSection {
  const root: NavSection = { title: '', order: 0, items: [], sections: [] };
  for (const d of docs) {
    const parts = d.id.split('/');
    if (d.id === 'index') continue;
    // A folder's index doc (id == folder path) names and orders the folder.
    const rel = sourceRel(d);
    const isIndex = /(^|\/)(index|readme)\.mdx?$/i.test(rel);
    let node = root;
    const dirs = isIndex ? parts : parts.slice(0, -1);
    dirs.forEach((dir, i) => {
      const key = parts.slice(0, i + 1).join('/');
      let next = node.sections.find((s) => s.key === key);
      if (!next) {
        next = { key, title: titleCase(dir), order: prefixOrder(dir) ?? 1000, items: [], sections: [] };
        node.sections.push(next);
      }
      node = next;
    });
    if (isIndex && dirs.length) {
      node.href = docHref(d.id);
      node.title = docTitle(d);
      node.order = docOrder(d);
      continue;
    }
    node.items.push({ title: docTitle(d), href: docHref(d.id), id: d.id, order: docOrder(d) });
  }
  const finish = (n: NavSection) => {
    n.items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    n.sections.forEach(finish);
    n.sections.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  };
  finish(root);
  return root;
}

/** Flattened reading order, for previous/next links. */
export function flatten(nav: NavSection): NavItem[] {
  return [...nav.items, ...nav.sections.flatMap(flatten)];
}
