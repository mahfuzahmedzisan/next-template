import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Setting this replaces Next's default list, so extend it: the SEO health
  // scanner reads metadata from <head>, which streaming would leave empty.
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|MahfuzSeoScanner`, "i"),
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
