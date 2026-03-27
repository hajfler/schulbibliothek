import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter — adequate for single-instance Coolify deployments.
// Replace with Redis-backed solution if the app scales to multiple instances.
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_MAX = 20;          // requests per window
const RATE_LIMIT_WINDOW = 60_000;   // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitStore.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Rate-limit auth endpoints to slow down brute-force / credential stuffing.
  if (pathname.startsWith("/api/auth")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
  }

  // Public routes — no session required.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  // Everything else requires an authenticated session.
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next.js internals and static assets; everything else goes through auth.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
