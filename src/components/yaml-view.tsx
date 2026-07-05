import { humanizeSegment } from "@/lib/routes";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function isPlainObject(value: Json): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: Json): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

function fieldLabel(key: string): string {
  return humanizeSegment(key.replace(/_/g, " "));
}

function ScalarValue({ value }: { value: string | number | boolean }) {
  const str = String(value);
  if (/^https?:\/\//.test(str)) {
    return (
      <a href={str} target="_blank" rel="noreferrer" className="text-accent-ink underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
        {str}
      </a>
    );
  }
  return <span className="whitespace-pre-line">{str}</span>;
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink">
          {item}
        </span>
      ))}
    </div>
  );
}

function StringArray({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4 text-sm text-ink">
      {items.map((item, i) => (
        <li key={i} className="whitespace-pre-line">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function YamlField({ label, value }: { label: string; value: Json }) {
  if (isEmpty(value)) return null;

  if (Array.isArray(value)) {
    const allStrings = value.every((v) => typeof v === "string");
    return (
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        {allStrings ? <StringArray items={value as string[]} /> : (
          <div className="space-y-3">
            {value.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <YamlBody data={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([, v]) => !isEmpty(v));
    const allArraysOfStrings = entries.every(([, v]) => Array.isArray(v) && v.every((x) => typeof x === "string"));
    if (allArraysOfStrings && entries.length > 0) {
      return (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
          <div className="space-y-2.5">
            {entries.map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-medium text-ink-soft">{fieldLabel(k)}</span>
                <TagList items={v as string[]} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        <div className="rounded-lg border border-border p-3">
          <YamlBody data={value} />
        </div>
      </div>
    );
  }

  if (value === null) return null;

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <div className="text-sm text-ink">
        <ScalarValue value={value} />
      </div>
    </div>
  );
}

/** Renders every field of an object, skipping empty values — the generic fallback for any YAML/JSON shape. */
export function YamlBody({ data, skip = [] }: { data: Json; skip?: string[] }) {
  if (!isPlainObject(data)) {
    if (Array.isArray(data)) return <StringArray items={data.map((d) => (typeof d === "string" ? d : JSON.stringify(d)))} />;
    return <ScalarValue value={data as string | number | boolean} />;
  }
  const entries = Object.entries(data).filter(([k, v]) => !skip.includes(k) && !isEmpty(v));
  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <YamlField key={key} label={fieldLabel(key)} value={value} />
      ))}
    </div>
  );
}
