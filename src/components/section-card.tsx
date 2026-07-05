import {
  UserCog,
  MessageSquareText,
  GraduationCap,
  Briefcase,
  BarChart3,
  Sparkles,
  Video,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import type { NavSection } from "@/lib/nav";
import { toPlainText } from "@/lib/routes";
import { SmartLink } from "./smart-link";

const ICON_SIZE = 18;

function sectionIcon(title: string) {
  if (/role/i.test(title)) return <UserCog size={ICON_SIZE} />;
  if (/interview/i.test(title)) return <MessageSquareText size={ICON_SIZE} />;
  if (/learning/i.test(title)) return <GraduationCap size={ICON_SIZE} />;
  if (/portfolio/i.test(title)) return <Briefcase size={ICON_SIZE} />;
  if (/job market/i.test(title)) return <BarChart3 size={ICON_SIZE} />;
  if (/awesome/i.test(title)) return <Sparkles size={ICON_SIZE} />;
  if (/webinar/i.test(title)) return <Video size={ICON_SIZE} />;
  return <BookOpen size={ICON_SIZE} />;
}

export function SectionCard({ section }: { section: NavSection }) {
  const browseRawHref = section.href ?? section.items[0]?.href ?? "";
  const visibleItems = section.items.slice(0, 5);
  const remaining = section.items.length - visibleItems.length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-paper-raised p-6 transition hover:border-accent/60 hover:shadow-md hover:shadow-black/5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          {sectionIcon(section.title)}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink">{section.title}</h3>
      </div>

      {section.intro && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{toPlainText(section.intro)}</p>
      )}

      {visibleItems.length > 0 && (
        <ul className="mt-4 flex-1 space-y-2 text-sm">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <SmartLink href={item.href} className="text-ink-soft transition hover:text-accent-ink">
                {item.text}
              </SmartLink>
            </li>
          ))}
        </ul>
      )}

      <SmartLink
        href={browseRawHref || "/"}
        className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-ink transition hover:gap-1.5"
      >
        {remaining > 0 ? `+${remaining} more` : "Explore section"}
        <ArrowUpRight size={14} />
      </SmartLink>
    </div>
  );
}
