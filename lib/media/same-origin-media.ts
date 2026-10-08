/** Turn a public storage URL into a same-origin path. The API host never reaches the browser. */
export function toSameOriginStorageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/api/storage/")) return value;

  const rewritten = value.replace(/https?:\/\/[^/\s"'\\]+\/storage\//g, "/api/storage/");
  return rewritten;
}
