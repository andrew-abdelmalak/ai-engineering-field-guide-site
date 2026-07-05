/** Splits a leading `# Title` line off markdown so it can be rendered with its own hero styling. */
export function splitTitle(markdown: string): { title: string | null; rest: string } {
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    const match = line.match(/^#\s+(.+)/);
    if (!match) return { title: null, rest: markdown };
    return { title: match[1].trim(), rest: lines.slice(i + 1).join("\n") };
  }
  return { title: null, rest: markdown };
}
