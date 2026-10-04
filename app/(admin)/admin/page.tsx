import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/auth-cookies";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const user = session?.user;

  const tiles = [
    {
      label: "Signed in as",
      value: user?.name ?? "—",
      icon: UserRound,
    },
    {
      label: "Role",
      value: user?.role ?? "—",
      icon: ShieldCheck,
    },
    {
      label: "Two-factor authentication",
      value: user?.two_factor_enabled ? "Enabled" : "Disabled",
      icon: KeyRound,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Demo workspace</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A static admin shell demonstrating the Fortify + Passport BFF auth
          flow. Manage your account and security settings from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold capitalize">{value}</p>
              </div>
              <Icon className="size-5 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">
            Authentication architecture
          </h2>
          <p className="text-sm text-muted-foreground">
            What is protecting this session, end to end.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {[
            {
              title: "BFF session cookie",
              body: "An httpOnly, encrypted (JWE / A256GCM) cookie holds your access and refresh tokens - never exposed to client-side JavaScript.",
            },
            {
              title: "Laravel Passport",
              body: "OAuth2 password grant issues short-lived access tokens (1h) and long-lived refresh tokens (14d), rotated on every use.",
            },
            {
              title: "Fortify-backed hardening",
              body: "Throttled login/registration, TOTP two-factor authentication with recovery codes, and server-validated password policies.",
            },
            {
              title: "Role-gated authorization",
              body: 'auth:api proves who you are; the "role" middleware decides what you can do.',
            },
          ].map((item) => (
            <div key={item.title}>
              <Badge variant="secondary" className="mb-2">
                {item.title}
              </Badge>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
