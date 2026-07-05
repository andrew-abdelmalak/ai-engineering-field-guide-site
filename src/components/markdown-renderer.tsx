import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { resolveRepoLink, isDangerousHref } from "@/lib/routes";
import { rawFileUrl } from "@/lib/github";

function buildComponents(baseDir: string): Components {
  return {
    a({ href, children, ...props }) {
      if (!href || isDangerousHref(href)) return <span {...props}>{children}</span>;
      const target = resolveRepoLink(baseDir, href);
      if (target.kind === "external") {
        const external = /^https?:\/\//i.test(href);
        return (
          <a
            href={href}
            {...props}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={target.href} {...props}>
          {children}
        </Link>
      );
    },
    img({ src, alt }) {
      if (!src || typeof src !== "string") return null;
      const resolved = /^https?:\/\//i.test(src) ? src : rawFileUrl(joinForImage(baseDir, src));
      return (
        <span className="my-6 block overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote, variable aspect-ratio content images */}
          <img src={resolved} alt={alt ?? ""} className="w-full" loading="lazy" />
        </span>
      );
    },
    table({ children }) {
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">{children}</table>
        </div>
      );
    },
  };
}

function joinForImage(baseDir: string, src: string): string {
  const parts = baseDir ? [...baseDir.split("/"), ...src.split("/")] : src.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

export function MarkdownRenderer({ content, baseDir }: { content: string; baseDir: string }) {
  return (
    <div className="prose-field">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={buildComponents(baseDir)}
      >
        {content}
      </Markdown>
    </div>
  );
}
