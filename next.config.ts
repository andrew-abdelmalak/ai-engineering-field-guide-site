import type { NextConfig } from "next";

// Dev needs 'unsafe-eval' (Fast Refresh/Turbopack HMR) and a permissive frame/connect
// policy (local preview/devtools tooling) — never relaxed in production.
const isProd = process.env.NODE_ENV === "production";
const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
const frameAncestors = isProd ? "frame-ancestors 'none'" : "frame-ancestors *";
const connectSrc = isProd ? "connect-src 'self'" : "connect-src 'self' ws: http:";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
