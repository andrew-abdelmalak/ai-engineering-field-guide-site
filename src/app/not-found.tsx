import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Compass size={24} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Off the trail</h1>
      <p className="mt-3 text-ink-soft">
        This page doesn&apos;t exist in the field guide — it may have been renamed or removed
        upstream in the source repository.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-accent-ink"
      >
        Back to the guide
      </Link>
    </div>
  );
}
