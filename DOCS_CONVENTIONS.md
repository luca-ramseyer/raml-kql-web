# Docs conventions

Copy this file into the app repo (for example as `docs/CONVENTIONS.md`) if you want the rules in one place. The website renders everything under `docs/`, so this file would be published too. Delete it, or exclude it, if you prefer.

The website needs no configuration for any of this. Every rule below is optional, and plain Markdown with no frontmatter works.

## Files and folders

- Every `.md` file under `docs/` becomes a page. The URL follows the path: `docs/guides/query-packs.md` is `/docs/guides/query-packs/`.
- Folders become sidebar sections. A folder's name becomes the section title (`getting-started/` is "Getting started").
- `docs/index.md` (or `README.md`) becomes the docs home page. Without one, the site lists all pages.
- A folder can have its own `index.md`. Its title is then the section heading, and the heading links to it.
- Images and other files can live anywhere under `docs/`. Reference them with relative paths: `![Results grid](../images/results-dark.png)`.

## Titles

The page title is the first `# Heading`, unless frontmatter sets `title`. The site shows it as the page heading and removes the first `#` heading from the body, so do not repeat it. A leading number and separator (`08 — Query packs`) is stripped from titles.

## Optional frontmatter

```yaml
---
title: Query packs          # sidebar and page title
description: Share queries as packs.   # subtitle and meta description
order: 20                   # sort position inside its folder (lower first)
---
```

Without `order`, pages sort by a leading number in the file name (`03-foo.md`), then alphabetically by title.

## Links

- Link between docs with relative `.md` paths: `[Query packs](./query-packs.md#manifest)`. The site rewrites them to site URLs. The same links work on GitHub.
- Links to files outside `docs/` (`../../examples/packs`) become links to that path in the app repo on GitHub.
- Use descriptive link text.

## Code

- Use fenced blocks with a language: ` ```kql `, `yaml`, `bash`, `json`. KQL is highlighted.
- Use inline code for commands, file names, setting names and columns.

## Suggested structure

If you reorganise, this order reads well for new users:

1. Getting started
2. Installation
3. Connecting tenants
4. Writing queries
5. Query packs
6. Extensions
7. Configuration reference
8. Contributing

Internal material (specs, decision log) can live in the same folder, for example under `docs/internals/`. It is published too.
