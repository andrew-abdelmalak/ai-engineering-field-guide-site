import { rawFileUrl, githubBlobUrl } from "./github";

/** Joins a link found inside a file at `baseDir` against the repo root, resolving `..` segments. */
export function joinRepoPath(baseDir: string, href: string): string {
  const clean = href.replace(/^\.\//, "");
  const parts = baseDir ? [...baseDir.split("/"), ...clean.split("/")] : clean.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

/** javascript:/data:/vbscript: hrefs from mirrored content must never reach a live <a href>. */
const DANGEROUS_SCHEMES = /^\s*(javascript|data|vbscript):/i;

export function isDangerousHref(href: string): boolean {
  return DANGEROUS_SCHEMES.test(href);
}

export function isExternalLink(href: string): boolean {
  return /^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:");
}

const DATA_EXTENSIONS = [".yaml", ".yml", ".json"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
const DOCUMENT_EXTENSIONS = [".pdf"];

export type ResolvedTarget =
  | { kind: "external"; href: string }
  | { kind: "doc"; path: string; href: string }
  | { kind: "dir"; path: string; href: string }
  | { kind: "data"; path: string; href: string }
  | { kind: "asset"; path: string; href: string };

/**
 * Classifies a repo-relative link so it can be routed inside the site
 * (doc page, directory browser, structured data view) instead of pointing
 * straight at GitHub.
 */
export function resolveRepoLink(baseDir: string, href: string): ResolvedTarget {
  if (isExternalLink(href) || href.startsWith("#")) return { kind: "external", href };

  const [pathPart, hashPart] = href.split("#");
  const path = joinRepoPath(baseDir, pathPart);
  const hash = hashPart ? `#${hashPart}` : "";

  if (pathPart.endsWith("/") || pathPart === "") {
    return { kind: "dir", path, href: `/browse/${path}${hash}` };
  }
  const lower = path.toLowerCase();
  if (lower.endsWith(".md")) {
    return { kind: "doc", path, href: `/docs/${path.replace(/\.md$/i, "")}${hash}` };
  }
  if (DATA_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return { kind: "data", path, href: `/data/${path}${hash}` };
  }
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext)) || DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return { kind: "asset", path, href: rawFileUrl(path) };
  }
  // Anything else (scripts, notebooks, config) - send straight to GitHub's source view.
  return { kind: "asset", path, href: githubBlobUrl(path) };
}

export class InvalidPathError extends Error {
  constructor() {
    super("Invalid path segment");
    this.name = "InvalidPathError";
  }
}

/** Rejects segments that couldn't be a real repo path component, before it ever reaches a URL. */
function assertSafeSlug(slug: string[]): void {
  for (const segment of slug) {
    if (segment === "" || segment === "." || segment === ".." || /[/\\]/.test(segment)) {
      throw new InvalidPathError();
    }
  }
}

export function docSlugToPath(slug: string[]): string {
  assertSafeSlug(slug);
  return `${slug.join("/")}.md`;
}

export function dirSlugToPath(slug: string[]): string {
  assertSafeSlug(slug);
  return slug.join("/");
}

/**
 * "05-reality-vs-postings" -> "Reality vs postings", "data_structured" -> "Data structured".
 * Pure numeric/date-like segments (e.g. "2026-06-25") are left untouched — only a
 * leading order prefix immediately followed by a letter (like "01-") is stripped.
 */
export function humanizeSegment(segment: string): string {
  if (/^[\d-]+$/.test(segment)) return segment;
  const withoutOrderPrefix = segment.replace(/^\d{1,2}[-.]+(?=[a-zA-Z])/, "");
  const spaced = withoutOrderPrefix.replace(/[-_]+/g, " ").trim() || segment;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Renders inline markdown (links, code ticks) down to plain text for use outside the full markdown pipeline. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function buildCrumbs(slug: string[], hrefPrefix: "docs" | "browse" | "data") {
  return slug.map((segment, i) => {
    const partial = slug.slice(0, i + 1).join("/");
    const isLast = i === slug.length - 1;
    return {
      text: humanizeSegment(segment),
      href: isLast ? undefined : `/${hrefPrefix}/${partial}`,
    };
  });
}
