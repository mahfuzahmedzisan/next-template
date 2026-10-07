"use client";

import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { ReactNode } from "react";

import { accountTabs, type AccountTab } from "@/lib/admin/account";
import { cn } from "@/lib/utils";

export function AccountNav({ active }: { active: AccountTab }) {
  return (
    <nav
      aria-label="Account"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-md"
    >
      {accountTabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "min-w-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AccountPageHeader({
  active,
  title,
  description,
}: {
  active: AccountTab;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <AccountNav active={active} />
    </div>
  );
}

export function AccountSection({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-md sm:p-6",
        danger ? "border-destructive/30" : "border-border/70",
      )}
    >
      <div className="mb-5">
        <h3
          className={cn(
            "font-heading text-lg font-semibold",
            danger && "text-destructive",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
