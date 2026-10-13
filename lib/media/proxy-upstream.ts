import "server-only";

import { getApiBaseUrl } from "@/lib/auth/http";

const TUS_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "content-length",
  "upload-length",
  "upload-offset",
  "upload-metadata",
  "tus-resumable",
  "upload-defer-length",
  "upload-concat",
  "upload-checksum",
] as const;

/** An SVG opened directly is a document; sandbox it so any missed script cannot run. */
const SVG_DOCUMENT_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";

const TUS_RESPONSE_HEADERS = [
  "upload-offset",
  "upload-length",
  "tus-resumable",
  "tus-version",
  "tus-extension",
  "tus-max-size",
  "upload-metadata",
  "upload-expires",
  "cache-control",
  "content-type",
] as const;

export async function proxyTus(request: Request, slug: string[] | undefined): Promise<Response> {
  const path = safePath(slug);
  if (path === null) {
    return Response.json({ message: "Invalid upload path." }, { status: 400 });
  }

  const base = upstreamUrl("tus", path);
  if (base === null) {
    return Response.json({ message: "Invalid upload path." }, { status: 400 });
  }

  const target = `${base}${new URL(request.url).search}`;
  const headers = new Headers();
  for (const name of TUS_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
      signal: upstreamSignal(request),
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ message: "Upload service is unavailable." }, { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: tusResponseHeaders(upstream.headers),
  });
}

export async function proxyStorage(request: Request, slug: string[] | undefined): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json({ message: "Method not allowed." }, { status: 405 });
  }

  const path = safePath(slug);
  if (path === null || path === "") {
    return Response.json({ message: "Invalid media path." }, { status: 400 });
  }

  const target = upstreamUrl("storage", path);
  if (target === null) {
    return Response.json({ message: "Invalid media path." }, { status: 400 });
  }

  const headers = new Headers();
  for (const name of ["range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      redirect: "manual",
      signal: upstreamSignal(request),
    });
  } catch {
    return Response.json({ message: "Media is unavailable." }, { status: 502 });
  }

  if (upstream.status === 404) {
    const moved = await renamedStoragePath(path, request);
    if (moved) {
      return new Response(null, {
        status: 308,
        headers: { location: `/api/storage/${moved.split("/").map(encodeURIComponent).join("/")}` },
      });
    }
  }

  if (path.endsWith(".m3u8") && upstream.ok && request.method !== "HEAD") {
    const text = rewritePlaylist(await upstream.text());
    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/vnd.apple.mpegurl",
        "cache-control": "no-cache",
      },
    });
  }

  const responseHeaders = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("x-content-type-options", "nosniff");
  if (/\.svgz?$/i.test(path) || responseHeaders.get("content-type")?.includes("svg")) {
    responseHeaders.set("content-security-policy", SVG_DOCUMENT_CSP);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

/**
 * A library file renamed after its slug changed: `<media id>/<old name>` now
 * lives at `<media id>/<new name>`. Returns the new path, or null.
 */
async function renamedStoragePath(path: string, request: Request): Promise<string | null> {
  const match = /^(\d+)\/[^/]+$/.exec(path);
  if (!match) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/media/files/${match[1]}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { path?: unknown } };
    const next = body.data?.path;
    if (typeof next !== "string" || next === path || !next.startsWith(`${match[1]}/`)) return null;
    return safePath(next.split("/"));
  } catch {
    return null;
  }
}

/** Matches nginx's 120s proxy timeouts; a client that disconnects aborts the upstream call too. */
const UPSTREAM_TIMEOUT_MS = 120_000;

function upstreamSignal(request: Request): AbortSignal {
  return AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]);
}

function tusResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  for (const name of TUS_RESPONSE_HEADERS) {
    const value = upstream.get(name);
    if (value) headers.set(name, value);
  }

  const location = upstream.get("location");
  const rewritten = rewriteTusLocation(location);
  if (rewritten) headers.set("location", rewritten);

  return headers;
}

export function rewriteTusLocation(location: string | null): string | null {
  if (!location) return null;

  try {
    const url = new URL(location, "http://upload.local");
    const marker = "/tus/";
    const index = url.pathname.indexOf(marker);
    const suffix = index >= 0 ? url.pathname.slice(index + marker.length) : "";
    const id = suffix.replace(/^\/+|\/+$/g, "");
    return `/api/tus${id ? `/${id}` : ""}${url.search}`;
  } catch {
    return null;
  }
}

function rewritePlaylist(playlist: string): string {
  return playlist.replace(/https?:\/\/[^/\s"'\\]+\/storage\//g, "/api/storage/");
}

/**
 * Next decodes each catch-all segment, so `%2F`, `%5C` or `%2e%2e` arrive here
 * as real separators or dots. Any separator, leftover `%`, or control
 * character inside a segment is rejected rather than normalised.
 */
export function safePath(slug: string[] | undefined): string | null {
  const parts = slug ?? [];
  const unsafe = (part: string) =>
    part === "" || part === "." || part === ".." || /[/\\%]/.test(part) || /[\u0000-\u001f\u007f]/.test(part);

  if (parts.some(unsafe)) {
    return null;
  }
  return parts.join("/");
}

/** Resolves the upstream URL and confirms it is still under `/<prefix>/` on the API origin. */
function upstreamUrl(prefix: "storage" | "tus", path: string): string | null {
  const origin = getApiBaseUrl();
  const root = new URL(`${origin}/${prefix}/`);

  let resolved: URL;
  try {
    resolved = new URL(path.split("/").map(encodeURIComponent).join("/"), root);
  } catch {
    return null;
  }

  if (resolved.origin !== root.origin || !resolved.pathname.startsWith(root.pathname)) {
    return null;
  }

  return resolved.toString().replace(/\?.*$/, "");
}
