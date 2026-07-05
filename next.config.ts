import type { NextConfig } from "next";

// Dev needs 'unsafe-eval' (Fast Refresh/Turbopack HMR) and a permissive frame/connect
// policy (local preview/devtools tooling) — never relaxed in production.
const isProd = process.env.NODE_ENV === "production";
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const frameAncestors = isProd ? "frame-ancestors 'none'" : "frame-ancestors *";
const connectSrc = isProd
  ? "connect-src 'self' https://api.github.com https://raw.githubusercontent.com"
  : "connect-src 'self' ws: http: https://api.github.com https://raw.githubusercontent.com";

// GitHub Pages serves a project repo under /<repo-name>/, not the domain root.
const GITHUB_PAGES_BASE_PATH = "/ai-engineering-field-guide-site";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath: GITHUB_PAGES_BASE_PATH,
        images: { unoptimized: true },
      }
    : {
        // headers() isn't supported (and is a no-op) under output: 'export' —
        // static hosts like GitHub Pages can't serve custom response headers
        // anyway, so this only applies to a real server deployment (Vercel etc).
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                ...(isProd ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
                {
                  key: "Content-Security-Policy",
                  value: `default-src 'self'; img-src 'self' https://raw.githubusercontent.com data:; ${scriptSrc}; style-src 'self' 'unsafe-inline'; ${connectSrc}; ${frameAncestors}`,
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
