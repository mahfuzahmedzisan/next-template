"use client";

import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { motion } from "motion/react";

import { AdminDashboardCharts, PersonalDashboardChart } from "@/components/admin/dashboard-charts";
import type { AuditTrend, MediaStats, ProfileActivityStats } from "@/lib/admin/stats-types";
import type { User } from "@/types/auth";

const easeOut = [0.22, 1, 0.36, 1] as const;

const architecture = [
  {
    title: "BFF session cookie",
    body: "An httpOnly, encrypted cookie holds your API token. It never reaches client-side JavaScript.",
  },
  {
    title: "Laravel Sanctum",
    body: "Hashed API tokens expire after 12 hours, or 30 days with Remember me, and are revoked on logout or a password change.",
  },
  {
    title: "Fortify hardening",
    body: "Throttled login and registration, TOTP two-factor authentication, and server-validated password policies.",
  },
  {
    title: "Role checks",
    body: "auth:sanctum proves who you are. The role middleware decides what you can do.",
  },
];

export type DashboardStats = {
  audit: AuditTrend | null;
  media: MediaStats | null;
  personal: ProfileActivityStats | null;
};

export function DashboardHome({ user, stats }: { user: User | undefined; stats: DashboardStats }) {
  const tiles = [
    {
      label: "Signed in as",
      value: user?.name ?? "—",
      hint: user?.email ?? "No email on this session",
      icon: UserRound,
      featured: true,
    },
    {
      label: "Role",
      value: user?.role ?? "—",
      hint: "Assigned by the API",
      icon: ShieldCheck,
      featured: false,
    },
    {
      label: "Two-factor",
      value: user?.two_factor_enabled ? "Enabled" : "Off",
      hint: user?.two_factor_enabled
        ? "Authenticator is protecting this account"
        : "Turn it on from Security",
      icon: KeyRound,
      featured: false,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        style={{ willChange: "transform, opacity" }}
      >
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Your account session, role, and security status in one place.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile, index) => (
          <motion.article
            key={tile.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.4, delay: 0.05 + index * 0.06, ease: easeOut }}
            style={{ willChange: "transform, opacity" }}
            className={
              tile.featured
                ? "rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground shadow-sm"
                : "rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={
                  tile.featured
                    ? "text-sm text-primary-foreground/80"
                    : "text-sm text-muted-foreground"
                }
              >
                {tile.label}
              </p>
              <tile.icon className="size-4 shrink-0 opacity-80" />
            </div>
            <p className="mt-4 text-2xl font-semibold capitalize tracking-tight">
              {tile.value}
            </p>
            <p
              className={
                tile.featured
                  ? "mt-2 truncate text-xs text-primary-foreground/75"
                  : "mt-2 truncate text-xs text-muted-foreground"
              }
            >
              {tile.hint}
            </p>
          </motion.article>
        ))}
      </div>

      {user?.role === "admin" ? (
        <AdminDashboardCharts audit={stats.audit} media={stats.media} />
      ) : (
        <PersonalDashboardChart stats={stats.personal} />
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22, ease: easeOut }}
        style={{ willChange: "transform, opacity" }}
        className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-md"
      >
        <h3 className="font-heading text-lg font-semibold">How this session is protected</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The pieces between the browser and Laravel.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {architecture.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/60 bg-background/60 p-4"
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
