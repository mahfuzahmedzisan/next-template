const PLACEHOLDER_ORIGIN = "http://redirect.invalid";

/**
 * Returns a same-site path for a `next` style value, or the fallback.
 * Rejects absolute and protocol-relative URLs, backslash tricks (`/\evil`)
 * and control characters, then resolves the rest to make sure the result
 * stays on this origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
