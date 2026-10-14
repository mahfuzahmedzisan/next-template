import { z } from "zod";

/**
 * Fail-fast env validation. Call `validateEnv()` once at server boot (see
 * `instrumentation.ts`) so a missing/misconfigured required variable throws
 * a clear, aggregated error immediately instead of surfacing as a confusing
 * runtime failure deep inside a request handler.
 *
 * Only variables that are *required* for the app to function at all are
 * validated here. Everything optional (Sentry, Reverb, module toggles,
 * SEO overrides) is read directly where it's used and defaults safely.
 */
const serverEnvSchema = z.object({
  LARAVEL_API_URL: z
    .string({ error: "LARAVEL_API_URL is required — base URL of the Laravel API this BFF proxies to." })
    .url("LARAVEL_API_URL must be a valid URL, e.g. http://127.0.0.1:8000"),
  BFF_SECRET: z
    .string({ error: "BFF_SECRET is required — shared secret sent as X-BFF-Secret, must match the API." })
    .min(16, "BFF_SECRET should be at least 16 characters. Generate with: openssl rand -base64 32"),
  SESSION_SECRET: z
    .string({ error: "SESSION_SECRET is required — used to encrypt the session cookie." })
    .min(16, "SESSION_SECRET should be at least 16 characters. Generate with: openssl rand -base64 32"),
  NEXT_PUBLIC_SITE_URL: z
    .string({ error: "NEXT_PUBLIC_SITE_URL is required — public URL of this app, used for canonical/OG tags." })
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL, e.g. https://example.com"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let validated: ServerEnv | null = null;

/**
 * Validates required server env vars once and caches the result. Safe to
 * call multiple times (e.g. once from instrumentation.ts, and defensively
 * elsewhere) — only parses on the first call.
 */
export function validateEnv(): ServerEnv {
  if (validated) return validated;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");

    throw new Error(
      `Invalid environment configuration. Fix the following and restart:\n${issues}\n\nSee .env.example for the full list of variables.`,
    );
  }

  validated = result.data;

  return validated;
}
