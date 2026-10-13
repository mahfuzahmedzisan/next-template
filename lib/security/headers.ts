// Imported by next.config.ts, so only relative imports and process.env here.

type Header = { key: string; value: string };

type SentryEndpoints = { origin: string; report: string };

const REPORT_GROUP = "csp-endpoint";

function sentryEndpoints(): SentryEndpoints | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) return null;

  try {
    const url = new URL(dsn);
    const segments = url.pathname.split("/").filter(Boolean);
    const projectId = segments.pop();

    if (!url.username || !projectId) return null;

    const prefix = segments.length ? `/${segments.join("/")}` : "";

    return {
      origin: url.origin,
      report: `${url.origin}${prefix}/api/${projectId}/security/?sentry_key=${url.username}`,
    };
  } catch {
    return null;
  }
}

function reverbSources(): string[] {
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST;

  if (!key || !host) return [];

  const port = process.env.NEXT_PUBLIC_REVERB_PORT ?? "8080";
  const secure = `wss://${host}:${port}`;

  // Without forceTLS, pusher-js falls back from ws to wss on the same port.
  return process.env.NEXT_PUBLIC_REVERB_SCHEME === "https" ? [secure] : [`ws://${host}:${port}`, secure];
}

export function cspEnforced(): boolean {
  return process.env.CSP_MODE === "enforce";
}

export function buildCsp(): string {
  const dev = process.env.NODE_ENV === "development";
  const preview = process.env.VERCEL_ENV === "preview";
  const https = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;
  const sentry = sentryEndpoints();
  const toolbar = preview ? ["https://vercel.live"] : [];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), ...toolbar],
    "style-src": ["'self'", "'unsafe-inline'", ...toolbar],
    "img-src": ["'self'", "data:", "blob:", ...(preview ? ["https://vercel.live", "https://vercel.com"] : [])],
    "font-src": ["'self'", "data:", ...(preview ? ["https://vercel.live", "https://assets.vercel.com"] : [])],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "connect-src": [
      "'self'",
      ...reverbSources(),
      ...(sentry ? [sentry.origin] : []),
      ...(preview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : []),
    ],
    "frame-src": ["'self'", ...toolbar],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  // Browsers ignore this directive in a Report-Only policy, and on plain-http hosts it would break requests.
  if (cspEnforced() && https) directives["upgrade-insecure-requests"] = [];

  if (sentry) {
    directives["report-uri"] = [sentry.report];
    directives["report-to"] = [REPORT_GROUP];
  }

  return Object.entries(directives)
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");
}

export function securityHeaders(): Header[] {
  const sentry = sentryEndpoints();

  return [
    {
      key: cspEnforced() ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value: buildCsp(),
    },
    ...(sentry ? [{ key: "Reporting-Endpoints", value: `${REPORT_GROUP}="${sentry.report}"` }] : []),
    // Sent separately because frame-ancestors has no effect while the CSP is Report-Only.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
}
