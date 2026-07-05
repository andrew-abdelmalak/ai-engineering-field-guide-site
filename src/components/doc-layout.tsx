import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { SidebarNav } from "./sidebar-nav";
import { TocNav } from "./toc-nav";
import type { NavSection } from "@/lib/nav";
import type { TocEntry } from "@/lib/toc";

export function DocLayout({
  sections,
  crumbs,
  toc,
  children,
}: {
  sections: NavSection[];
  crumbs: Crumb[];
  toc: TocEntry[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10">
            <SidebarNav sections={sections} />
          </div>
        </aside>

        <article className="min-w-0">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">{children}</div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10">
            <TocNav entries={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
