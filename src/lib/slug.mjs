import GithubSlugger from 'github-slugger';

const slug = (s) => new GithubSlugger().slug(s);

/** Doc URL slug for a path relative to the docs root, e.g. "guides/Query-Packs.md" -> "guides/query-packs". */
export function docSlug(relPath) {
  const parts = relPath.replace(/\\/g, '/').replace(/\.mdx?$/i, '').split('/').map(slug);
  const last = parts[parts.length - 1];
  if (last === 'index' || last === 'readme') parts.pop();
  return parts.length ? parts.join('/') : 'index';
}
