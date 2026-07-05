import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentNotFoundError, getFileContent } from "@/lib/github";
import { getSiteNav, collectDocPaths } from "@/lib/nav";
import { docSlugToPath, humanizeSegment, InvalidPathError, resolveRepoLink } from "@/lib/routes";
import { splitTitle } from "@/lib/markdown-split";
import { extractToc } from "@/lib/toc";
import { DocLayout } from "@/components/doc-layout";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { UpdatedBadge } from "@/components/updated-badge";

// Must be a literal (Next statically parses this) — flipped to `false` by
// scripts/build-static.mjs for static-export builds, where every param has
// to come from generateStaticParams below (no server to fall back to).
export const dynamicParams = true;

/**
 * Statically pre-renders every markdown page actually linked from the
 * README's nav (root section links plus nested children, e.g. the Interview
 * Questions sub-list) — the same set a reader can reach by clicking through
 * the site, not every .md file that happens to exist in the repo.
 */
export async function generateStaticParams() {
  const nav = await getSiteNav();
  const paths = collectDocPaths(nav, (href) => {
    const target = resolveRepoLink("", href);
    return target.kind === "doc" ? target.path : null;
  });
  return paths.map((path) => ({ slug: path.replace(/\.md$/i, "").split("/") }));
}

async function loadDoc(slug: string[]) {
  const path = docSlugToPath(slug);
  const content = await getFileContent(path);
  const { title, rest } = splitTitle(content);
  return { path, title: title ?? humanizeSegment(slug[slug.length - 1]), rest };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { title, rest } = await loadDoc(slug);
    const firstParagraph = rest.split("\n\n").find((block) => block.trim() && !block.startsWith("#"));
    return {
      title,
      description: firstParagraph?.slice(0, 160),
    };
  } catch {
    return { title: humanizeSegment(slug[slug.length - 1] ?? "Not found") };
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  let doc;
  try {
    doc = await loadDoc(slug);
  } catch (error) {
    if (error instanceof ContentNotFoundError || error instanceof InvalidPathError) notFound();
    throw error;
  }

  const [nav, toc] = await Promise.all([getSiteNav(), Promise.resolve(extractToc(doc.rest))]);
  const baseDir = slug.slice(0, -1).join("/");
  const crumbs: { text: string; href?: string }[] = slug.slice(0, -1).map((segment, i) => ({
    text: humanizeSegment(segment),
    href: `/browse#${slug.slice(0, i + 1).join("/")}`,
  }));
  crumbs.push({ text: doc.title });

  return (
    <DocLayout sections={nav.sections} crumbs={crumbs} toc={toc}>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {doc.title}
      </h1>
      <div className="mt-4">
        <UpdatedBadge path={doc.path} />
      </div>
      <div className="mt-8">
        <MarkdownRenderer content={doc.rest} baseDir={baseDir} />
      </div>
    </DocLayout>
  );
}
