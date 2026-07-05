import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

const TAGS = ["repo-content", "repo-tree", "repo-meta", "repo-commits"];

// Best-effort per-instance rate limit — this is a single low-value endpoint
// (worst case on abuse is extra GitHub API calls), not a substitute for a
// shared store in a multi-instance deployment.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyGithubSignature(secret: string, body: string, signatureHeader: string | null): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  return safeEqual(expected, signatureHeader);
}

function verifySharedSecret(secret: string, request: Request): boolean {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const fromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = fromQuery ?? fromHeader;
  return Boolean(provided) && safeEqual(secret, provided!);
}

/**
 * On-demand cache invalidation, meant to be called by a GitHub webhook (push
 * event) so content updates land within seconds instead of waiting for the
 * hourly ISR revalidation. Requires REVALIDATE_SECRET (shared-secret mode)
 * or GITHUB_WEBHOOK_SECRET (HMAC-verified GitHub webhook mode) to be set —
 * with neither configured the endpoint refuses all requests.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const sharedSecret = process.env.REVALIDATE_SECRET;

  if (!webhookSecret && !sharedSecret) {
    return NextResponse.json({ error: "Revalidation is not configured on this deployment." }, { status: 501 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  const authorized =
    (webhookSecret && verifyGithubSignature(webhookSecret, body, signature)) ||
    (sharedSecret && verifySharedSecret(sharedSecret, request));

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const tag of TAGS) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tags: TAGS, at: new Date().toISOString() });
}
