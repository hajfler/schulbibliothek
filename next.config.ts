import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // Next.js App Router requires 'unsafe-inline' for streaming hydration scripts.
  // Migrate to nonce-based CSP once report-only phase confirms no violations.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind CSS requires 'unsafe-inline' for utility styles.
  "style-src 'self' 'unsafe-inline'",
  // External image hosts mirrored from images.remotePatterns.
  "img-src 'self' data: blob: https://covers.openlibrary.org https://books.google.com https://lh3.googleusercontent.com https://graph.microsoft.com https://images.thalia.media",
  // Microsoft Entra ID OAuth redirect flow + NextAuth client session calls.
  "connect-src 'self' https://login.microsoftonline.com https://*.microsoft.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://login.microsoftonline.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  // Report-Only: violations are logged to the browser console, nothing breaks.
  // Switch to "Content-Security-Policy" once the report-only phase is clean.
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
      { protocol: "https", hostname: "*.microsoftonline.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
