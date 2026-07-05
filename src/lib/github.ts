import {
  GITHUB_BRANCH,
  GITHUB_OWNER,
  GITHUB_REPO,
  CONTENT_REVALIDATE_SECONDS,
  DIRECTORY_REVALIDATE_SECONDS,
} from "./config";

export type GithubEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  sha: string;
};

export type CommitInfo = {
  sha: string;
  date: string | null;
  message: string;
};

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    : { Accept: "application/vnd.github+json" };
}

export class ContentNotFoundError extends Error {
  constructor(path: string) {
    super(`Not found in repository: ${path}`);
    this.name = "ContentNotFoundError";
  }
}

/** Encodes each path segment individually so a segment can never alter the URL's query/authority. */
function encodeRepoPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Fetches a raw file straight from raw.githubusercontent.com — cheaper than
 * the contents API (no base64 decoding, not counted against the same rate
 * limit bucket) and this is by far the most frequent call the site makes.
 */
export async function getFileContent(path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodeRepoPath(path)}`;
  const res = await fetch(url, {
    next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["repo-content", `path:${path}`] },
  });
  if (res.status === 404) throw new ContentNotFoundError(path);
  if (!res.ok) {
    console.error(`GitHub raw fetch failed (${res.status}) for ${path}`);
    throw new Error("GitHub raw fetch failed");
  }
  return res.text();
}

/** Lists the entries of a directory via the GitHub contents API. */
export async function getDirectory(path: string): Promise<GithubEntry[]> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeRepoPath(path)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: DIRECTORY_REVALIDATE_SECONDS, tags: ["repo-tree", `dir:${path}`] },
  });
  if (res.status === 404) throw new ContentNotFoundError(path);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`GitHub contents API failed (${res.status}) for ${path}: ${body.slice(0, 200)}`);
    throw new Error("GitHub contents API failed");
  }
  const data = (await res.json()) as GithubEntry[];
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

/** Fetches the whole repo tree in one call — used to build static nav data. */
export async function getFullTree(): Promise<{ path: string; type: "blob" | "tree" }[]> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: DIRECTORY_REVALIDATE_SECONDS, tags: ["repo-tree"] },
  });
  if (!res.ok) throw new Error(`GitHub tree API failed (${res.status})`);
  const data = (await res.json()) as { tree: { path: string; type: string }[] };
  return data.tree
    .filter((t) => t.type === "blob" || t.type === "tree")
    .map((t) => ({ path: t.path, type: t.type as "blob" | "tree" }));
}

/** Repo-level metadata for the homepage hero (stars, last push, description). */
export async function getRepoMeta() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["repo-meta"] },
  });
  if (!res.ok) throw new Error(`GitHub repo API failed (${res.status})`);
  return res.json() as Promise<{
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    pushed_at: string;
    description: string;
  }>;
}

/** Last commit touching a given path — used for "updated" badges on key pages. */
export async function getLastCommit(path: string): Promise<CommitInfo | null> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${encodeURIComponent(
    path,
  )}&sha=${GITHUB_BRANCH}&per_page=1`;
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: ["repo-commits", `commit:${path}`] },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sha: string;
    commit: { message: string; committer: { date: string } | null };
  }[];
  if (!data.length) return null;
  const [c] = data;
  return { sha: c.sha, date: c.commit.committer?.date ?? null, message: c.commit.message };
}

export function rawFileUrl(path: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encodeRepoPath(path)}`;
}

export function githubBlobUrl(path: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${encodeRepoPath(path)}`;
}

export function githubTreeUrl(path: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${encodeRepoPath(path)}`;
}
