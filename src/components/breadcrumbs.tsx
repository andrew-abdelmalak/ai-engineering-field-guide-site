import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { text: string; href?: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
      <Link href="/" className="hover:text-accent">
        Guide
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} />
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-accent">
              {crumb.text}
            </Link>
          ) : (
            <span className="text-ink-soft">{crumb.text}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
