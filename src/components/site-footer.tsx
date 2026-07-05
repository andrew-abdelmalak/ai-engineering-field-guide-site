import Link from "next/link";
import { REPO_URL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-ink">AI Engineering Field Guide</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Every page on this site is fetched live from{" "}
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline decoration-accent/50 underline-offset-2 hover:text-accent">
                the source repository
              </a>{" "}
              — nothing here is hardcoded, so it updates as soon as the repo does.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-ink-faint">Explore</span>
              <Link href="/browse#job-market/data_structured" className="text-ink-soft hover:text-accent">Job market data</Link>
              <Link href="/browse#interview/data" className="text-ink-soft hover:text-accent">Interview company data</Link>
              <Link href="/docs/awesome" className="text-ink-soft hover:text-accent">Awesome list</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-ink-faint">Author</span>
              <a href="https://alexeyondata.substack.com/" target="_blank" rel="noreferrer" className="text-ink-soft hover:text-accent">
                Alexey on Data
              </a>
              <a href="https://github.com/alexeygrigorev" target="_blank" rel="noreferrer" className="text-ink-soft hover:text-accent">
                @alexeygrigorev
              </a>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs text-ink-faint">
          Unofficial reader built on public repository content. Not affiliated with the author beyond linking to their work.
        </p>
      </div>
    </footer>
  );
}
