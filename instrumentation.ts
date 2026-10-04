export async function register() {
  if (process.env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

type CaptureRequestError = typeof import("@sentry/nextjs").captureRequestError;

export async function onRequestError(
  error: unknown,
  request: Parameters<CaptureRequestError>[1],
  context: Parameters<CaptureRequestError>[2],
) {
  if (process.env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) {
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
}
