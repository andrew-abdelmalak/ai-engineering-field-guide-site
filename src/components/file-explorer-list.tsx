"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileJson, FileText, ExternalLink } from "lucide-react";

export type ExplorerFile = {
  name: string;
  href: string;
  kind: "data" | "other";
  external: boolean;
  size: number;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PAGE_SIZE = 60;

export function FileExplorerList({ files }: { files: ExplorerFile[] }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!query.trim()) return files;
    const q = query.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const shown = filtered.slice(0, visible);

  return (
    <div>
      {files.length > 20 && (
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder={`Search ${files.length.toLocaleString()} files…`}
          className="mb-4 w-full rounded-lg border border-border bg-paper-raised px-3.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
        />
      )}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {shown.map((file) => {
          const Icon = file.kind === "data" ? FileJson : FileText;
          const content = (
            <>
              <Icon size={15} className="shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-ink-faint">{formatBytes(file.size)}</span>
              {file.external && <ExternalLink size={13} className="shrink-0 text-ink-faint" />}
            </>
          );
          return (
            <li key={file.href}>
              {file.external ? (
                <a
                  href={file.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-accent-soft"
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={file.href}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-accent-soft"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-ink-faint">
          No files match &ldquo;{query}&rdquo;.
        </p>
      )}

      {visible < filtered.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-accent"
        >
          Show more ({filtered.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
