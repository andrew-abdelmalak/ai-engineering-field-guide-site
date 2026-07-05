import GithubSlugger from "github-slugger";

export type TocEntry = { id: string; text: string; depth: 2 | 3 };

/** Mirrors rehype-slug's id generation (same github-slugger) so anchors line up. */
export function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  const lines = markdown.split("\n");
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = line.match(/^(##|###)\s+(.+)/);
    if (!match) continue;
    const depth = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    entries.push({ id: slugger.slug(text), text, depth });
  }
  return entries;
}
