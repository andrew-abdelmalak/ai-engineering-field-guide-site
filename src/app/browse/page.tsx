"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Loader2, TriangleAlert } from "lucide-react";
import { clientGetDirectory, clientGetFileContent } from "@/lib/github-client";
import { ContentNotFoundError, githubBlobUrl, type GithubEntry } from "@/lib/github";
import { getSiteNavClient } from "@/lib/nav-client";
import { buildHashCrumbs, humanizeSegment } from "@/lib/routes";
import { splitTitle } from "@/lib/markdown-split";
import { extractToc } from "@/lib/toc";
import { DocLayout } from "@/components/doc-layout";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { FileExplorerList, type ExplorerFile } from "@/components/file-explorer-list";
import { useHashPath } from "@/hooks/use-hash-path";
import type { NavSection } from "@/lib/nav";

const DATA_EXTENSIONS = [".yaml", ".yml", ".json"];

type Result =
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; entries: GithubEntry[]; readmeBody: string; title: string };

export default function BrowsePage() {
  const path = useHashPath();
  const [nav, setNav] = useState<NavSection[]>([]);
  // Keyed by the path it was loaded for, so "loading" is derived (below)
  // instead of reset imperatively at the top of the effect.
  const [loaded, setLoaded] = useState<{ path: string; result: Result } | null>(null);

  useEffect(() => {
    getSiteNavClient()
      .then((n) => setNav(n.sections))
      .catch(() => setNav([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const entries = await clientGetDirectory(path);
        const readmeEntry = entries.find((e) => e.type === "file" && e.name.toLowerCase() === "readme.md");
        const readme = readmeEntry ? await clientGetFileContent(readmeEntry.path).catch(() => null) : null;
        const { title: parsedTitle, rest } = readme ? splitTitle(readme) : { title: null, rest: "" };
        const segments = path.split("/").filter(Boolean);
        const title = parsedTitle ?? humanizeSegment(segments[segments.length - 1] ?? "Browse");
        if (!cancelled) setLoaded({ path, result: { status: "ready", entries, readmeBody: rest, title } });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ContentNotFoundError) setLoaded({ path, result: { status: "not-found" } });
        else
          setLoaded({
            path,
            result: { status: "error", message: error instanceof Error ? error.message : "Failed to load" },
          });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [path]);

  const crumbs = buildHashCrumbs(path, "browse");
  const isLoading = loaded?.path !== path;

  if (isLoading) {
    return (
      <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
        <div className="flex items-center gap-2 text-ink-faint">
          <Loader2 size={16} className="animate-spin" />
          Loading /{path}…
        </div>
      </DocLayout>
    );
  }

  const { result } = loaded;

  if (result.status === "not-found") {
    return (
      <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
        <div className="flex items-center gap-2 text-ink-faint">
          <TriangleAlert size={16} />
          No directory found at <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-xs">/{path}</code>
        </div>
      </DocLayout>
    );
  }

  if (result.status === "error") {
    return (
      <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
        <div className="flex items-center gap-2 text-ink-faint">
          <TriangleAlert size={16} />
          {result.message}
        </div>
      </DocLayout>
    );
  }

  const { entries, readmeBody, title } = result;
  const dirs = entries.filter((e) => e.type === "dir");
  const docs = entries.filter(
    (e) => e.type === "file" && e.name.toLowerCase().endsWith(".md") && e.name.toLowerCase() !== "readme.md",
  );
  const dataFiles = entries.filter(
    (e) => e.type === "file" && DATA_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext)),
  );
  const otherFiles = entries.filter(
    (e) =>
      e.type === "file" &&
      !e.name.toLowerCase().endsWith(".md") &&
      !DATA_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext)),
  );

  const explorerFiles: ExplorerFile[] = [
    ...docs.map((e) => ({ name: e.name, href: `/docs/${e.path.replace(/\.md$/, "")}`, kind: "other" as const, external: false, size: e.size })),
    ...dataFiles.map((e) => ({ name: e.name, href: `/data#${e.path}`, kind: "data" as const, external: false, size: e.size })),
    ...otherFiles.map((e) => ({ name: e.name, href: githubBlobUrl(e.path), kind: "other" as const, external: true, size: e.size })),
  ];

  const toc = readmeBody ? extractToc(readmeBody) : [];

  return (
    <DocLayout sections={nav} crumbs={crumbs} toc={toc}>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-faint">
        {entries.length.toLocaleString()} item{entries.length === 1 ? "" : "s"} in{" "}
        <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-xs">/{path}</code>
      </p>

      {readmeBody && (
        <div className="mt-8">
          <MarkdownRenderer content={readmeBody} baseDir={path} />
        </div>
      )}

      {dirs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink">Subdirectories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {dirs.map((dir) => (
              <Link
                key={dir.path}
                href={`/browse#${dir.path}`}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3 text-sm font-medium transition hover:border-accent hover:bg-accent-soft"
              >
                <Folder size={16} className="text-accent" />
                {dir.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {explorerFiles.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink">Files</h2>
          <div className="mt-3">
            <FileExplorerList files={explorerFiles} />
          </div>
        </section>
      )}
    </DocLayout>
  );
}
