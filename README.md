# Raml KQL website

The website for [Raml KQL](https://github.com/luca-ramseyer/raml-kql), live at <https://kql.raml.ch>.

This repo holds only the site. **It does not contain the documentation.** The docs are written in the app repo's `docs/` folder and rendered here at build time, so there is nothing to copy and nothing to keep in sync.

Stack: [Astro](https://astro.build) (static output) and TypeScript, with no client-side framework. Search is [Pagefind](https://pagefind.app) (static, no backend). The docs layout is hand-built to match the brand, not a docs theme.

## Local development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev        # fetches docs + latest release first, then starts astro dev
npm run build      # fetch, astro check, astro build, pagefind index -> dist/
npm run preview
npm run check      # astro check only
```

`predev` and `prebuild` run `npm run fetch`, which does three things:

1. `scripts/fetch-docs.mjs` makes a shallow, sparse clone of the app repo's docs folder into `.content/` and mirrors images to `public/docs-assets/`. Both are gitignored.
2. `scripts/fetch-release.mjs` reads the latest GitHub release into `.content/release.json`. If it fails, the site falls back to a link to the releases page. It never fails the build.
3. `scripts/prepare-screenshots.mjs` writes web-sized screenshots into `public/shots/`.

Search only works in a production build (`npm run build && npm run preview`), because the Pagefind index is created after `astro build`.

### Previewing docs edits without pushing

Point `DOCS_LOCAL_PATH` at the docs folder in a local clone of the app repo:

```bash
DOCS_LOCAL_PATH=../raml-kql/docs npm run dev
```

The content collection reads that folder directly, so Markdown edits show up as you save. Images are copied when `npm run fetch` runs, so restart the dev server after adding or changing images.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DOCS_REPO` | `luca-ramseyer/raml-kql` | App repo (owner/name). Also used for release lookup and "Edit on GitHub" links. |
| `DOCS_REF` | `main` | Branch or tag to fetch docs from. |
| `DOCS_PATH` | `docs` | Docs folder inside the app repo. |
| `DOCS_LOCAL_PATH` | unset | Use a local folder instead of cloning, for example `../raml-kql/docs`. |
| `SITE_URL` | `https://kql.raml.ch` | Canonical URL, sitemap, Open Graph. |
| `SITE_BASE` | `/` | Base path. Only needed if the site is not served from a domain root. |
| `GITHUB_TOKEN` | unset | Optional. Raises the API rate limit for the release lookup. |

In CI, set `DOCS_*`, `SITE_URL` and `SITE_BASE` as repository **variables** (Settings > Secrets and variables > Actions > Variables). All are optional.

## How the docs are rendered

- Every Markdown file under the docs folder is a page: `guides/query-packs.md` becomes `/docs/guides/query-packs/`.
- The sidebar is built from the folder structure. Optional frontmatter (`title`, `description`, `order`) refines it. Without frontmatter the title is the first `#` heading. See [`DOCS_CONVENTIONS.md`](DOCS_CONVENTIONS.md), which you can copy into the app repo.
- Relative links between docs (`./query-packs.md`) are rewritten to site URLs. Links that leave `docs/` become GitHub links into the app repo. Relative images are rewritten to `/docs-assets/...` and copied into the build.
- Every page has an "Edit this page on GitHub" link to the source file.
- Code blocks use Shiki with a custom palette theme (`src/shiki/raml-theme.json`). KQL is highlighted with Shiki's bundled `kusto` grammar (`kql` alias). Copy buttons are added by a small script in `src/layouts/Base.astro`.

## Landing page content

- Release version and download links come from the GitHub Releases API **at build time**. There are no client-side API calls.
- Screenshots: the landing page uses `results-dark.png` and `chart.png` from the app repo's `docs/images/`. To use different images, add `public/screenshots/app.png` and/or `public/screenshots/chart.png`. They take priority. Provide PNGs of at least 1600px width.
- Open Graph image and Apple touch icon: `npm run og` regenerates `public/og.png` and `public/apple-touch-icon.png` (needs a Chromium: `CHROMIUM_PATH=/path/to/chromium npm run og`).
- Copy that needs your review is marked `TODO(luca):` in the source (`grep -rn "TODO(luca)" src docs`).

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds with `withastro/action` and deploys with `actions/deploy-pages`. It runs on:

- push to `main`
- `repository_dispatch` with type `docs-updated` (sent by the app repo)
- `workflow_dispatch`
- a daily schedule (05:17 UTC), as a safety net for docs and the release version

One-time setup:

1. Settings > Pages > Source: **GitHub Actions**.
2. Settings > Pages > Custom domain: `kql.raml.ch` (`public/CNAME` also carries it). At your DNS provider, add `CNAME kql → luca-ramseyer.github.io`. Then enable "Enforce HTTPS".

### Moving to Vercel later

Import the repo in Vercel (framework: Astro), build command `npm run build`, output `dist`, Node 22. Set the same env vars in the Vercel project, delete `deploy.yml`, and point the DNS record at Vercel. For a Vercel deploy hook, change the app repo's notify step to call it instead of `repository_dispatch`. Nothing in the code is GitHub Pages specific, except `public/CNAME`, which Vercel ignores.

## App-repo dispatch

[`docs/app-repo-workflow/notify-website.yml`](docs/app-repo-workflow/notify-website.yml) is a ready-to-paste workflow for the **app repo**. Copy it to `.github/workflows/notify-website.yml` there. It sends `repository_dispatch` (`docs-updated`) to this repo when:

- `docs/**` changes on `main`
- the app's **Release** workflow finishes and a release was published in the last three hours
- you run it manually

It uses `workflow_run` instead of `release: published` because the app's release workflow publishes with the default `GITHUB_TOKEN`, and events caused by that token do not trigger other workflows.

Token setup:

1. GitHub > Settings > Developer settings > Fine-grained tokens > Generate new token.
2. Resource owner: your account. Repository access: **Only select repositories** > `luca-ramseyer/raml-kql-web`.
3. Repository permissions: **Contents: Read and write**. This is what GitHub requires for `repository_dispatch`. Leave everything else at "No access".
4. Choose an expiry and set a reminder to rotate it. Fine-grained tokens expire.
5. In the app repo: Settings > Secrets and variables > Actions > New repository secret, name `WEBSITE_DISPATCH_TOKEN`.

## Design rules

The source of truth is the [brand style guide](https://luca-ramseyer.github.io/brand/style-guide.html) and the brand repo's `tokens.json` and `AGENTS.md`. Colour, type and spacing values in `src/styles/tokens.css` are copied from `tokens.json`. Change the brand repo first, then update the file.

- Swiss restraint. Paper dominates, ink carries the type, red is seasoning. When in doubt, remove something.
- Corners are 3px, borders are 1px hairlines. No shadows, gradients or glass. Motion is a 200ms colour transition only.
- Cormorant Garamond for the wordmark and headings, Montserrat for everything else. No third family.
- **Exception, flagged:** code blocks and inline code use the system monospace stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`). No web font is loaded for it.
- Fonts load from Google Fonts with `display=swap`. Metric-matched fallback faces ("Montserrat Fallback", "Cormorant Fallback") are added after the web fonts in the stacks to limit layout shift. They are fallbacks, not a third family.
- Contrast: stone (`#857E72`) is 3.5:1 on cream, so it is never used for text. Red (`#C0473A`) is 4.4:1 on cream, so text that turns red on hover uses the brand's `--red-deep` (`#A63B30`, 5.6:1), and the primary button is ink with cream text.
- Dark mode follows the system setting (`prefers-color-scheme`), with no manual toggle. Roles are swapped, not new hues: ink becomes the surface and cream the text. Only two values are not brand tokens, the page ground `#1B1916` and the lighter hover red `#E57F72`, both documented in `src/styles/tokens.css`. Code blocks keep the same ink theme in both modes.
- The favicon is `public/favicon.svg`: arm thickness 21.5%, arm length 62%, corner radius 10% of the square.
- No analytics, no cookies, no third-party requests other than Google Fonts.

## Layout of this repo

```
scripts/        fetch-docs, fetch-release, prepare-screenshots, make-og
src/lib/        docs navigation, release parsing, remark plugin for links and images
src/shiki/      code theme
src/pages/      landing page, docs routes, 404
docs/           app-repo-workflow/notify-website.yml (not rendered by the site)
```
