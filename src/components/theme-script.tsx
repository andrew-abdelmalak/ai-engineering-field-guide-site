const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

/**
 * Runs once, pre-hydration, straight from server-rendered HTML — sets the
 * .dark class before first paint. `type` toggles between text/javascript
 * (server) and text/plain (client) per Next's documented pattern, which
 * keeps React from re-processing the tag as a live script during hydration
 * and complaining about it in dev.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
