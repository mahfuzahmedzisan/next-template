import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Proxy (Next.js 16) cannot call `headers()` the way a Route Handler can.
 * It records the browser origin here before any Laravel call so the axios
 * interceptor still sends X-Frontend-Origin.
 */
export const frontendOriginStore = new AsyncLocalStorage<string>();

export function runWithFrontendOrigin<T>(origin: string, fn: () => T): T {
  return frontendOriginStore.run(origin, fn);
}
