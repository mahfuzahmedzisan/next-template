import "server-only";

/** Same-origin paths. The browser never receives the Laravel host. */
export const BROWSER_TUS_ENDPOINT = "/api/tus";

export function toBrowserMedia<T>(value: T): T {
  const json = JSON.stringify(value).replace(
    /https?:\/\/[^/\s"'\\]+\/storage\//g,
    "/api/storage/",
  );
  const parsed = JSON.parse(json) as T;
  return rewriteTusEndpoint(parsed);
}

function rewriteTusEndpoint<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => rewriteTusEndpoint(item)) as T;

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    next[key] = key === "tus_endpoint" ? BROWSER_TUS_ENDPOINT : rewriteTusEndpoint(entry);
  }
  return next as T;
}
