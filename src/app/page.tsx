import Link from "next/link";
import { ArrowRight, Code2, Star, GitFork } from "lucide-react";
import { getSiteNav } from "@/lib/nav";
import { getRepoMeta } from "@/lib/github";
import { getFieldGuideStats } from "@/lib/stats";
import { resolveRepoLink } from "@/lib/routes";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { SectionCard } from "@/components/section-card";
import { REPO_URL } from "@/lib/config";

export default async function HomePage() {
  const [nav, repoMeta, stats] = await Promise.all([
    getSiteNav(),
    getRepoMeta().catch(() => null),
    getFieldGuideStats().catch(() => null),
  ]);

  const firstSection = nav.sections[0];
  const startHref = firstSection?.items[0]
    ? resolveRepoLink("", firstSection.items[0].href).href
    : "/";

  const updated = repoMeta?.pushed_at
    ? new Date(repoMeta.pushed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div>
      <section className="field-texture border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-paper-raised px-4 py-1.5 text-xs font-medium text-ink-soft">
            Synced live from GitHub · updated automatically on every push
          </p>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            {nav.title || "AI Engineering Field Guide"}
          </h1>
          <div className="mx-auto mt-6 max-w-2xl text-ink-soft">
            <MarkdownRenderer content={nav.intro} baseDir="" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={startHref}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-accent-ink"
            >
              Start reading
              <ArrowRight size={15} />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
            >
              <Code2 size={15} />
              View source repo
            </a>
          </div>

          {repoMeta && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} /> {repoMeta.stargazers_count.toLocaleString()} stars
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitFork size={14} /> {repoMeta.forks_count.toLocaleString()} forks
              </span>
              {updated && <span>Last updated {updated}</span>}
            </div>
          )}
        </div>
      </section>

      {stats && (
        <section className="border-b border-border bg-paper-raised">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
            <Stat value={stats.jobDescriptions.toLocaleString()} label="Structured job descriptions" />
            <Stat value={stats.scrapeDates.toString()} label="Job market scrape dates" />
            <Stat value={stats.interviewCompanies.toString()} label="Companies in interview data" />
            <Stat value={nav.sections.length.toString()} label="Guide sections" />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Explore the guide</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Mirrors the repository&apos;s own structure — every section below reads directly
          from the current README and its linked documents.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {nav.sections.map((section) => (
            <SectionCard key={section.title} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-semibold text-accent-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{label}</p>
    </div>
  );
}
