"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/**
 * Hand-rolled instead of next-themes: that library renders an inline
 * <script> inside the component tree, which React 19 flags as an error
 * ("script tag while rendering") when it re-renders client-side. The
 * anti-flash script here runs once from the server-rendered <head> (see
 * ThemeScript) and is never part of the React tree, so it never re-runs.
 *
 * useSyncExternalStore (rather than useEffect+setState) is the correct
 * primitive for reading the .dark class set by that pre-hydration script —
 * it returns the server snapshot during hydration and syncs to the real
 * DOM state right after, with no extra render-then-setState flash.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
  }, []);

  return { theme, setTheme };
}
