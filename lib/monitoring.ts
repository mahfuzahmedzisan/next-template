export function reportError(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureException(error);
  });
}
