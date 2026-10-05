import "server-only";

import { headers } from "next/headers";
import { frontendOriginStore } from "@/lib/auth/frontend-origin-store";

function browserOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export async function resolveFrontendOrigin(): Promise<string> {
  const fromProxy = frontendOriginStore.getStore();
  if (fromProxy) return fromProxy;

  const headerStore = await headers();
  const fromOrigin = browserOrigin(headerStore.get("origin"));
  if (fromOrigin) return fromOrigin;

  const proto =
    headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const host = (
    headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  )
    ?.split(",")[0]
    ?.trim();

  const fromHost = host ? browserOrigin(`${proto}://${host}`) : null;
  if (fromHost) return fromHost;

  throw new Error("Unable to resolve the browser origin for this request");
}
