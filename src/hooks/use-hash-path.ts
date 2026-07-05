"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getSnapshot(): string {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function getServerSnapshot(): string {
  return "";
}

/** The repo path encoded in the URL hash (e.g. "#job-market/data_structured" -> "job-market/data_structured"). */
export function useHashPath(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
