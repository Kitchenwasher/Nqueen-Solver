import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 240;

type RateBucket = {
  count: number;
  windowStart: number;
};

const rateBuckets = new Map<string, RateBucket>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.windowStart > WINDOW_MS * 2) {
      rateBuckets.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  const shouldApplyRateLimit = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
  if (!shouldApplyRateLimit) {
    return NextResponse.next();
  }

  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = getClientKey(request);
  const current = rateBuckets.get(key);

  if (!current || now - current.windowStart >= WINDOW_MS) {
    rateBuckets.set(key, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  current.count += 1;

  if (current.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1000));
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Apply to app routes and route handlers, but skip static assets and common files.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images|audio).*)"
  ]
};
