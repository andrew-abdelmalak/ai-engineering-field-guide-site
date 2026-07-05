# AI Engineering Field Guide — Site

A reader for the [AI Engineering Field Guide](https://github.com/alexeygrigorev/ai-engineering-field-guide) repository. Every page — nav, prose, tables, YAML records — is fetched live from GitHub; nothing from the source repo is hardcoded here. Ships two ways from one codebase: a normal Next.js server deployment, or a fully static build for GitHub Pages (no server at all).

## How content flows

- `src/lib/github.ts` — fetches file content, directory listings, and commit metadata from `raw.githubusercontent.com` / `api.github.com`, cached via Next's fetch cache (`revalidate` + tags).
- `src/lib/nav.ts` — parses the repo's own `README.md` (sections, links, descriptions) into the site's navigation. Add a section to the upstream README and it shows up here automatically.
- `src/lib/routes.ts` — resolves any relative link found inside fetched markdown to an internal route (`/docs/*` for a markdown file, `/browse#path` for a directory, `/data#path` for a YAML/JSON record) or leaves it external.
- `/docs/[...slug]` — a markdown doc, statically pre-rendered (full prose + TOC + sidebar). The exact page list comes from walking the parsed nav (`generateStaticParams` in that route), not a hardcoded list or a blanket repo scan.
- `/browse` and `/data` — single client-rendered pages that read the target repo path from the URL **hash** (e.g. `/browse#job-market/data_structured/2026-06-25`) and fetch straight from GitHub's public API in the browser. No server involved, which is what makes them work unmodified on GitHub Pages — same code path whether this is deployed to Vercel or Pages.

**Curation note:** the site's nav mirrors the upstream README's own structure. The `_internal/` directories (`interview/_internal`, `job-market/_internal`, `portfolio/_internal`) hold the author's research scaffolding (scrapers, notebooks, raw fetch dumps) and aren't linked from that README, so they're intentionally not surfaced — the `job-market/data_structured` and `job-market/data_raw` folders (~4,900 files each) and `interview/data/job-descriptions` (51 companies) get the dynamic `/browse` explorer instead of ~10k statically generated pages.

## Two ways to deploy

### A. Static export → GitHub Pages (no server, no cost)

```bash
npm run build:static   # outputs to out/
```

This is what `.github/workflows/deploy-pages.yml` runs automatically: on every push, and on a nightly cron (`17 3 * * *` UTC) so the site stays in sync with upstream changes even though there's no server to receive a webhook. To turn it on for a real deployment: push this repo to GitHub, then Settings → Pages → Source → "GitHub Actions". First deploy will be live at `https://<you>.github.io/ai-engineering-field-guide-site/`.

The build script temporarily removes `src/app/api` and flips `/docs/[...slug]`'s `dynamicParams` to `false` for the duration of the static build (both need to be literal/absent for `output: 'export'`), then restores them — see `scripts/build-static.mjs`. If you rename the repo, update `GITHUB_PAGES_BASE_PATH` in `next.config.ts` to match (GitHub Pages serves a project repo under `/<repo-name>/`, not the domain root).

### B. Normal server (Vercel, or any Node host)

```bash
npm run build
npm start
```

Gets you the full feature set of A, plus `POST /api/revalidate` for instant cache invalidation on push (see below) instead of waiting for the nightly rebuild.

## Environment variables

All optional — see `.env.example`.

- `GITHUB_TOKEN` — raises the API rate limit from 60/hr to 5000/hr. Not needed for the GitHub Pages path (the Actions workflow gets this for free from `secrets.GITHUB_TOKEN`, no setup required); useful for a server deployment or for local development if you hit the limit.
- `REVALIDATE_SECRET` / `GITHUB_WEBHOOK_SECRET` — server deployment only. Enable `POST /api/revalidate` for instant cache busting (wire `GITHUB_WEBHOOK_SECRET` to a GitHub webhook on the source repo for the real thing, or use `REVALIDATE_SECRET` for a manual/cron trigger).

## Development

```bash
npm install
npm run dev
```
