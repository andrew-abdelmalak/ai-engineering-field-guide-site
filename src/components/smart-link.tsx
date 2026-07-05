import Link from "next/link";
import type { ReactNode } from "react";
import { resolveRepoLink, isDangerousHref } from "@/lib/routes";

/** Resolves a raw README href (internal repo path or external URL) to the right link element. */
export function SmartLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (isDangerousHref(href)) return <span className={className}>{children}</span>;
  const target = resolveRepoLink("", href);
  if (target.kind === "external") {
    return (
      <a href={target.href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={target.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
