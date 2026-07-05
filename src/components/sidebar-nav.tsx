"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { NavSection } from "@/lib/nav";
import { resolveRepoLink } from "@/lib/routes";
import { SmartLink } from "./smart-link";

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Guide sections" className="space-y-6 text-sm">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === resolveRepoLink("", item.href).href;
              return (
                <li key={item.href}>
                  <SmartLink
                    href={item.href}
                    className={clsx(
                      "block rounded-md px-2.5 py-1.5 transition",
                      active
                        ? "bg-accent-soft font-medium text-accent-ink"
                        : "text-ink-soft hover:bg-accent-soft/60 hover:text-ink",
                    )}
                  >
                    {item.text}
                  </SmartLink>
                  {item.children.length > 0 && (
                    <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2.5">
                      {item.children.map((child) => {
                        const childActive = pathname === resolveRepoLink("", child.href).href;
                        return (
                          <li key={child.href}>
                            <SmartLink
                              href={child.href}
                              className={clsx(
                                "block rounded-md px-2 py-1 text-[13px] transition",
                                childActive
                                  ? "bg-accent-soft font-medium text-accent-ink"
                                  : "text-ink-faint hover:text-ink",
                              )}
                            >
                              {child.text}
                            </SmartLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
