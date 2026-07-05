import { getFileContent } from "./github";
import { CONTENT_REVALIDATE_SECONDS } from "./config";

export type NavLink = {
  text: string;
  href: string;
  description?: string;
  children: NavLink[];
};

export type NavSection = {
  title: string;
  /** If the H2 itself was a markdown link (e.g. "## [Awesome](awesome.md)") */
  href?: string;
  /** Raw markdown intro paragraphs that appear before the section's list, if any */
  intro: string;
  items: NavLink[];
};

export type SiteNav = {
  title: string;
  intro: string;
  sections: NavSection[];
};

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/;

function parseLinkLine(raw: string): NavLink | null {
  const match = raw.match(LINK_RE);
  if (!match) return null;
  const [full, text, href] = match;
  const rest = raw.slice(raw.indexOf(full) + full.length).trim();
  const description = rest.replace(/^-\s*/, "").trim() || undefined;
  return { text, href: href.trim(), description, children: [] };
}

function indentOf(line: string): number {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function isListLine(line: string): boolean {
  return /^\s*(-|\d+\.)\s+/.test(line);
}

/**
 * Parses the repo's README-style markdown (see STYLING.md conventions: H1
 * title, H2 sections, "- [text](href) - description" lists, 2-space nested
 * sub-lists) into a navigation tree. This runs against the live file content
 * on every revalidation, so the nav always mirrors the current README.
 */
export function parseNavMarkdown(markdown: string): SiteNav {
  const lines = markdown.split("\n");
  let title = "";
  const introLines: string[] = [];
  const sections: NavSection[] = [];
  let current: NavSection | null = null;
  let introMode = true;
  const sectionIntroLines: string[] = [];
  const stack: { indent: number; item: NavLink }[] = [];

  const flushSectionIntro = () => {
    if (current) current.intro = sectionIntroLines.join("\n").trim();
    sectionIntroLines.length = 0;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);

    if (h1 && !title) {
      title = h1[1].trim();
      introMode = true;
      continue;
    }

    if (h2) {
      flushSectionIntro();
      introMode = false;
      const headingText = h2[1].trim();
      const linkMatch = headingText.match(LINK_RE);
      current = {
        title: linkMatch ? linkMatch[1] : headingText,
        href: linkMatch ? linkMatch[2] : undefined,
        intro: "",
        items: [],
      };
      sections.push(current);
      stack.length = 0;
      continue;
    }

    if (introMode && !current) {
      if (line.trim().length || introLines.length) introLines.push(line);
      continue;
    }

    if (!current) continue;

    if (isListLine(line)) {
      const indent = indentOf(line);
      const link = parseLinkLine(line);
      if (!link) continue;

      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

      if (stack.length === 0) {
        current.items.push(link);
      } else {
        stack[stack.length - 1].item.children.push(link);
      }
      stack.push({ indent, item: link });
    } else if (line.trim().length === 0) {
      // blank lines don't end a list block
    } else if (!isListLine(line)) {
      if (current.items.length === 0) sectionIntroLines.push(line);
    }
  }
  flushSectionIntro();

  return {
    title,
    intro: introLines.join("\n").trim(),
    sections,
  };
}

export async function getSiteNav(): Promise<SiteNav> {
  const readme = await getFileContent("README.md");
  return parseNavMarkdown(readme);
}

export const NAV_REVALIDATE = CONTENT_REVALIDATE_SECONDS;
