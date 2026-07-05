"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/toc";
import clsx from "clsx";

export function TocNav({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!entries.length) return;
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (observedEntries) => {
        const visible = observedEntries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [entries]);

  if (!entries.length) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-ink-faint">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {entries.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: entry.depth === 3 ? "1.5rem" : "0.75rem" }}>
            <a
              href={`#${entry.id}`}
              className={clsx(
                "-ml-px block border-l-2 py-1 pl-3 transition",
                activeId === entry.id
                  ? "border-accent font-medium text-accent-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
