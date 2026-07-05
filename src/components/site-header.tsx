"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, Code2 } from "lucide-react";
import type { NavSection } from "@/lib/nav";
import { ThemeToggle } from "./theme-toggle";
import { SmartLink } from "./smart-link";
import { REPO_URL } from "@/lib/config";

function sectionRawHref(section: NavSection): string {
  return section.href ?? section.items[0]?.href ?? "/";
}

export function SiteHeader({ sections }: { sections: NavSection[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-base font-semibold text-paper">
            F
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            AI Engineering Field Guide
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {sections.map((section) => (
            <div
              key={section.title}
              className="relative"
              onMouseEnter={() => setOpenSection(section.title)}
              onMouseLeave={() => setOpenSection((s) => (s === section.title ? null : s))}
            >
              <SmartLink
                href={sectionRawHref(section)}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-accent-soft hover:text-accent-ink"
              >
                {section.title}
                {section.items.length > 0 && <ChevronDown size={14} />}
              </SmartLink>
              {section.items.length > 0 && openSection === section.title && (
                <div className="absolute left-0 top-full w-72 pt-2">
                  <div className="rounded-xl border border-border bg-paper-raised p-2 shadow-lg shadow-black/5">
                    {section.items.map((item) => (
                      <SmartLink
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft"
                      >
                        <div className="font-medium">{item.text}</div>
                        {item.description && (
                          <div className="mt-0.5 line-clamp-1 text-xs text-ink-faint">
                            {item.description}
                          </div>
                        )}
                      </SmartLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-accent sm:inline-flex"
          >
            <Code2 size={15} />
            Source
          </a>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-soft lg:hidden"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-paper lg:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
            {sections.map((section) => (
              <div key={section.title}>
                <SmartLink
                  href={sectionRawHref(section)}
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-base font-semibold text-ink"
                >
                  {section.title}
                </SmartLink>
                <div className="mt-2 flex flex-col gap-1 border-l border-border pl-3">
                  {section.items.map((item) => (
                    <SmartLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="py-1 text-sm text-ink-soft"
                    >
                      {item.text}
                    </SmartLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
