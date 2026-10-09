import "server-only";

/**
 * Playback stays on this site. The tus endpoint stays on the API host:
 * video bytes must not pass through the Vercel function, which cuts the
 * request before tusd can save the upload offset.
 */
export function toBrowserMedia<T>(value: T): T {
  const json = JSON.stringify(value).replace(
    /https?:\/\/[^/\s"'\\]+\/storage\//g,
    "/api/storage/",
  );
  return JSON.parse(json) as T;
}
