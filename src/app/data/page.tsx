"use client";

import { useEffect, useState } from "react";
import YAML from "yaml";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import { clientGetFileContent } from "@/lib/github-client";
import { ContentNotFoundError, githubBlobUrl } from "@/lib/github";
import { getSiteNavClient } from "@/lib/nav-client";
import { buildHashCrumbs, humanizeSegment } from "@/lib/routes";
import { DocLayout } from "@/components/doc-layout";
import { YamlBody } from "@/components/yaml-view";
import { useHashPath } from "@/hooks/use-hash-path";
import type { NavSection } from "@/lib/nav";

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

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type Result =
  | { status: "not-found" }
  | { status: "too-large" }
  | { status: "error"; message: string }
  | { status: "ready"; obj: { [key: string]: Json } };

export default function DataPage() {
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
    if (!path) return;
    let cancelled = false;

    async function load() {
      try {
        const raw = await clientGetFileContent(path);
        if (raw.length > MAX_FILE_BYTES) {
          if (!cancelled) setLoaded({ path, result: { status: "too-large" } });
          return;
        }
        let data: Json;
        try {
          data = YAML.parse(raw, { maxAliasCount: 100, schema: "core" }) as Json;
        } catch {
          data = { raw };
        }
        if (!cancelled) setLoaded({ path, result: { status: "ready", obj: asObject(data) } });
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

  const crumbs = buildHashCrumbs(path, "data");

  if (!path) {
    return (
      <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
        <div className="flex items-center gap-2 text-ink-faint">
          <TriangleAlert size={16} />
          No file selected — follow a data link from a guide page or the job market browser.
        </div>
      </DocLayout>
    );
  }

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

  if (result.status === "not-found" || result.status === "too-large" || result.status === "error") {
    const message =
      result.status === "not-found"
        ? `No file found at /${path}`
        : result.status === "too-large"
          ? "This file is too large to render here."
          : result.message;
    return (
      <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
        <div className="flex items-center gap-2 text-ink-faint">
          <TriangleAlert size={16} />
          {message}
        </div>
      </DocLayout>
    );
  }

  const { obj } = result;
  const lastSegment = path.split("/").filter(Boolean).pop() ?? "Data file";
  const title =
    (typeof obj.title === "string" && obj.title) ||
    (typeof obj.position === "object" && obj.position !== null && !Array.isArray(obj.position)
      ? (obj.position as { title?: Json }).title
      : null) ||
    (typeof obj.role === "string" && obj.role) ||
    humanizeSegment(lastSegment.replace(/\.(ya?ml|json)$/i, ""));

  const company = companyName(obj);
  const metaBits = [obj.location, obj.work_type, obj.company_size, obj.posted_date, obj.source].filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );

  const skip = new Set(["title"]);
  if (typeof obj.company === "string") skip.add("company");
  if (typeof obj.url === "string") skip.add("url");

  return (
    <DocLayout sections={nav} crumbs={crumbs} toc={[]}>
      <div className="rounded-xl border border-border bg-paper-raised p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Structured record</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {String(title)}
        </h1>
        {company && <p className="mt-1 text-ink-soft">{company}</p>}
        {metaBits.length > 0 && <p className="mt-2 text-sm text-ink-faint">{metaBits.join(" · ")}</p>}
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
