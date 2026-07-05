import { Clock } from "lucide-react";
import { getLastCommit, githubBlobUrl } from "@/lib/github";

export async function UpdatedBadge({ path }: { path: string }) {
  const commit = await getLastCommit(path).catch(() => null);
  if (!commit?.date) return null;

  const date = new Date(commit.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <a
      href={githubBlobUrl(path)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-ink-faint transition hover:border-accent hover:text-accent"
      title={commit.message}
    >
      <Clock size={12} />
      Updated {date} · view source
    </a>
  );
}
