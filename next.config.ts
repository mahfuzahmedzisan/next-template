import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { withSentryConfig } from "@sentry/nextjs/config";

import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Setting this replaces Next's default list, so extend it: the SEO health
  // scanner reads metadata from <head>, which streaming would leave empty.
  // The token must match the one baked into the API's SEO_SCANNER_USER_AGENT
  // (see API/mahfuz-ahmed-api/config/seo.php) - both sides read the same
  // SEO_SCANNER_UA_TOKEN env var so changing it only needs updating in one
  // place per app instead of silently breaking SEO health scanning.
  htmlLimitedBots: new RegExp(
    `${HTML_LIMITED_BOT_UA_RE.source}|${process.env.SEO_SCANNER_UA_TOKEN || "TemplateSeoScanner"}`,
    "i",
  ),
  // Fewer breakpoints keep each srcset short; covers never render wider than 1200 CSS px.
  images: {
    deviceSizes: [640, 828, 1200, 1920],
  },
  // 301 rather than Next's default 308: several SEO checkers only accept 301 for duplicate home URLs.
  async redirects() {
    return ["/index.html", "/index.php", "/home"].map((source) => ({
      source,
      destination: "/",
      statusCode: 301 as const,
    }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export default dsn
  ? withSentryConfig(nextConfig, {
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : nextConfig;
