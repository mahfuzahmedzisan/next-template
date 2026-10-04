const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && process.env.NODE_ENV === "production") {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      enabled: true,
      tracesSampleRate: 0.1,
    });
  });
}
