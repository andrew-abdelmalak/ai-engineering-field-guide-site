"use client";

import { clientGetFileContent } from "./github-client";
import { parseNavMarkdown, type SiteNav } from "./nav";

/** Client-side counterpart to getSiteNav() (lib/nav.ts) — same parser, fetched in the browser. */
export async function getSiteNavClient(): Promise<SiteNav> {
  const readme = await clientGetFileContent("README.md");
  return parseNavMarkdown(readme);
}
