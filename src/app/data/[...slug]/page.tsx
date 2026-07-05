import type { Metadata } from "next";
import { notFound } from "next/navigation";
import YAML from "yaml";
import { ContentNotFoundError, getFileContent, githubBlobUrl } from "@/lib/github";
import { getSiteNav } from "@/lib/nav";
import { buildCrumbs, dirSlugToPath, humanizeSegment, InvalidPathError } from "@/lib/routes";
import { DocLayout } from "@/components/doc-layout";
import { YamlBody } from "@/components/yaml-view";
import { ExternalLink } from "lucide-react";

export const dynamicParams = true;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function asObject(data: Json): { [key: string]: Json } {
  return typeof data === "object" && data !== null && !Array.isArray(data) ? data : {};
}

function companyName(data: { [key: string]: Json }): string | null {
  const company = data.company;
  if (typeof company === "string") return company;
  if (typeof company === "object" && company !== null && !Array.isArray(company)) {
    const name = company.name;
    return typeof name === "string" ? name : null;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: humanizeSegment(slug[slug.length - 1] ?? "Data file") };
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export default async function DataPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  let path: string;
  let raw: string;
  try {
    path = dirSlugToPath(slug);
    raw = await getFileContent(path);
  } catch (error) {
    if (error instanceof ContentNotFoundError || error instanceof InvalidPathError) notFound();
    throw error;
  }

  if (raw.length > MAX_FILE_BYTES) notFound();

  let data: Json;
  try {
    data = YAML.parse(raw, { maxAliasCount: 100, schema: "core" }) as Json;
  } catch {
    data = { raw };
  }
  const obj = asObject(data);

  const title =
    (typeof obj.title === "string" && obj.title) ||
    (typeof obj.position === "object" && obj.position !== null && !Array.isArray(obj.position)
      ? (obj.position as { title?: Json }).title
      : null) ||
    (typeof obj.role === "string" && obj.role) ||
    humanizeSegment(slug[slug.length - 1].replace(/\.(ya?ml|json)$/i, ""));

  const company = companyName(obj);
  const metaBits = [obj.location, obj.work_type, obj.company_size, obj.posted_date, obj.source]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");

  const skip = new Set(["title"]);
  if (typeof obj.company === "string") skip.add("company");
  if (typeof obj.url === "string") skip.add("url");

  const nav = await getSiteNav();
  const crumbs = buildCrumbs(slug, "data");

  return (
    <DocLayout sections={nav.sections} crumbs={crumbs} toc={[]}>
      <div className="rounded-xl border border-border bg-paper-raised p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Structured record</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {String(title)}
        </h1>
        {company && <p className="mt-1 text-ink-soft">{company}</p>}
        {metaBits.length > 0 && (
          <p className="mt-2 text-sm text-ink-faint">{metaBits.join(" · ")}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {typeof obj.url === "string" && (
            <a
              href={obj.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-accent-ink hover:underline"
            >
              Original posting <ExternalLink size={13} />
            </a>
          )}
          <a
            href={githubBlobUrl(path)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-ink-faint hover:text-accent"
          >
            View source file <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="mt-8">
        <YamlBody data={obj} skip={[...skip]} />
      </div>
    </DocLayout>
  );
}
