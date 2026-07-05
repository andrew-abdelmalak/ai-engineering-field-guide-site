# AI Engineering Field Guide — Site

A Next.js reader for the [AI Engineering Field Guide](https://github.com/alexeygrigorev/ai-engineering-field-guide) repository. Every page — nav, prose, tables, YAML records — is fetched live from GitHub at request time; nothing from the source repo is hardcoded here.

## How content flows

- `src/lib/github.ts` — fetches file content, directory listings, and commit metadata from `raw.githubusercontent.com` / `api.github.com`, cached via Next's fetch cache (`revalidate` + tags).
- `src/lib/nav.ts` — parses the repo's own `README.md` (sections, links, descriptions) into the site's navigation. Add a section to the upstream README and it shows up here automatically.
- `src/lib/routes.ts` — resolves any relative link found inside fetched markdown to an internal route (`/docs/*` for a markdown file, `/browse/*` for a directory, `/data/*` for a YAML/JSON record) or leaves it external.
- Three route families cover everything: `/docs/[...slug]` (a markdown doc, full prose + TOC + sidebar), `/browse/[...slug]` (a directory: its README if it has one, plus subfolders/files), `/data/[...slug]` (a single YAML/JSON file rendered as a structured card).

**Curation note:** the site's nav mirrors the upstream README's own structure. The `_internal/` directories (`interview/_internal`, `job-market/_internal`, `portfolio/_internal`) hold the author's research scaffolding (scrapers, notebooks, raw fetch dumps) and aren't linked from that README, so they're intentionally not surfaced — the `job-market/data_structured` and `job-market/data_raw` folders (~4,900 files each) and `interview/data/job-descriptions` (51 companies) get a dynamic browser/search UI instead of ~10k statically generated pages.

## Environment variables

All optional — see `.env.example`. Without them the site still works, just at GitHub's unauthenticated rate limit (60 req/hr) and with content updates arriving via the hourly ISR revalidation instead of instantly.

- `GITHUB_TOKEN` — raises the API rate limit to 5000/hr.
- `REVALIDATE_SECRET` / `GITHUB_WEBHOOK_SECRET` — enable `POST /api/revalidate` for instant cache busting on every upstream push (wire `GITHUB_WEBHOOK_SECRET` to a GitHub webhook for the real thing, or use `REVALIDATE_SECRET` for a manual/cron trigger).

## Development

```bash
npm install
npm run dev
```

## Deploying

Any Next.js host works; Vercel needs zero config. Set the env vars above in your host's dashboard. If you configure `GITHUB_WEBHOOK_SECRET`, add a webhook in the source repo (Settings → Webhooks → push event → `https://<your-domain>/api/revalidate`) for near-instant updates; otherwise content refreshes on its own within the hour via ISR.
