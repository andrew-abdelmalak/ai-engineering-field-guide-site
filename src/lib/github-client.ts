"use client";

import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_REPO } from "./config";
import { ContentNotFoundError, type GithubEntry } from "./github";

/**
 * Browser-side counterparts to lib/github.ts, used by /browse and /data
 * (which are plain client components so they work unmodified on static
 * hosts like GitHub Pages — no server, no API route, no token). These never
 * send an Authorization header, so they run against GitHub's unauthenticated
 * public rate limit (60 req/hr per visitor IP), which is fine for a public
 * read-only repo at this traffic scale.
 */

function encodeRepoPath(path: string): string {
  return path
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

export async function clientGetFileContent(path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodeRepoPath(path)}`;
  const res = await fetch(url);
  if (res.status === 404) throw new ContentNotFoundError(path);
  if (!res.ok) throw new Error(`GitHub raw fetch failed (${res.status})`);
  return res.text();
}

export async function clientGetDirectory(path: string): Promise<GithubEntry[]> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeRepoPath(path)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (res.status === 404) throw new ContentNotFoundError(path);
  if (!res.ok) throw new Error(`GitHub contents API failed (${res.status})`);
  const data = (await res.json()) as GithubEntry[];
  return data.sort((a, b) => a.name.localeCompare(b.name));
}
