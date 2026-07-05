import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Folder } from "lucide-react";
import { ContentNotFoundError, getDirectory, getFileContent, githubBlobUrl } from "@/lib/github";
import { getSiteNav } from "@/lib/nav";
import { buildCrumbs, dirSlugToPath, humanizeSegment, InvalidPathError } from "@/lib/routes";
import { splitTitle } from "@/lib/markdown-split";
import { extractToc } from "@/lib/toc";
import { DocLayout } from "@/components/doc-layout";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { FileExplorerList, type ExplorerFile } from "@/components/file-explorer-list";

export const dynamicParams = true;

const DATA_EXTENSIONS = [".yaml", ".yml", ".json"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: humanizeSegment(slug[slug.length - 1] ?? "Browse") };
}

export default async function BrowsePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  let path: string;
  let entries;
  try {
    path = dirSlugToPath(slug);
    entries = await getDirectory(path);
  } catch (error) {
    if (error instanceof ContentNotFoundError || error instanceof InvalidPathError) notFound();
    throw error;
  }

  const readmeEntry = entries.find((e) => e.type === "file" && e.name.toLowerCase() === "readme.md");
  const readme = readmeEntry ? await getFileContent(readmeEntry.path).catch(() => null) : null;
  const { title: parsedTitle, rest: readmeBody } = readme ? splitTitle(readme) : { title: null, rest: "" };
  const title = parsedTitle ?? humanizeSegment(slug[slug.length - 1]);

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
    ...dataFiles.map((e) => ({ name: e.name, href: `/data/${e.path}`, kind: "data" as const, external: false, size: e.size })),
    ...otherFiles.map((e) => ({
      name: e.name,
      href: githubBlobUrl(e.path),
      kind: "other" as const,
      external: true,
      size: e.size,
    })),
  ];

  const nav = await getSiteNav();
  const crumbs = buildCrumbs(slug, "browse");
  const toc = readmeBody ? extractToc(readmeBody) : [];

  return (
    <DocLayout sections={nav.sections} crumbs={crumbs} toc={toc}>
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
                href={`/browse/${dir.path}`}
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
