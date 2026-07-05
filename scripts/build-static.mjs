#!/usr/bin/env node
// Builds the static-export version for GitHub Pages (or any static host).
//
// Two things Next.js requires to be literal, hard-coded values (they can't
// be computed from an env var) get flipped for the duration of this build
// and restored afterwards, success or failure:
//   - The /api/revalidate route can't exist at all in `output: 'export'`
//     (no server, so a POST handler is meaningless) — moved out of app/.
//   - /docs/[...slug]'s `dynamicParams` must be `false` in export mode
//     (every path has to come from generateStaticParams, no server
//     fallback exists) but `true` for a normal server deployment.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apiDir = join(root, "src", "app", "api");
const apiDirHidden = join(root, "src", "app", "_api_disabled_for_static_export");
const docsPagePath = join(root, "src", "app", "docs", "[...slug]", "page.tsx");

const hadApiDir = existsSync(apiDir);
if (hadApiDir) renameSync(apiDir, apiDirHidden);

const originalDocsPage = readFileSync(docsPagePath, "utf8");
const staticDocsPage = originalDocsPage.replace(
  "export const dynamicParams = true;",
  "export const dynamicParams = false;",
);
if (staticDocsPage === originalDocsPage) {
  throw new Error("Could not find `export const dynamicParams = true;` in the docs page to flip for static export.");
}
writeFileSync(docsPagePath, staticDocsPage);

try {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: { ...process.env, NEXT_PUBLIC_STATIC_EXPORT: "true" },
  });
  process.exitCode = result.status ?? 1;
} finally {
  if (hadApiDir) renameSync(apiDirHidden, apiDir);
  writeFileSync(docsPagePath, originalDocsPage);
}
