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

  const target = `${getApiBaseUrl()}/tus/${path}${new URL(request.url).search}`;
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

  const origin = getApiBaseUrl();
  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("range", range);

  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/storage/${path}`, {
      method: request.method,
      headers,
      redirect: "manual",
    });
  } catch {
    return Response.json({ message: "Media is unavailable." }, { status: 502 });
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
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
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

function safePath(slug: string[] | undefined): string | null {
  const parts = slug ?? [];
  if (parts.some((part) => part === "" || part === "." || part === ".." || part.includes("\\"))) {
    return null;
  }
  return parts.join("/");
}
