import { CheckCircle2, CircleSlash, XCircle } from "lucide-react";

import { PRIORITY_LABELS } from "@/components/admin/seo/health/health-meta";
import { Badge } from "@/components/ui/badge";
import type { SeoAuditCheck } from "@/lib/admin/seo-audit-types";
import { cn } from "@/lib/utils";

export function CheckRow({ check }: { check: SeoAuditCheck }) {
  const Icon = !check.counted ? CircleSlash : check.passed ? CheckCircle2 : XCircle;

  return (
    <li className="flex gap-3 p-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          !check.counted ? "text-muted-foreground" : check.passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{check.label}</p>
          {check.informational ? <Badge variant="outline">Informational</Badge> : null}
          {!check.counted ? <Badge variant="outline">Not scored</Badge> : null}
          {!check.passed && check.counted ? (
            <Badge variant="secondary">{PRIORITY_LABELS[check.priority]}</Badge>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{check.message}</p>
        {check.actual !== null || check.expected !== null ? (
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 text-xs">
            <dt className="text-muted-foreground">Found</dt>
            <dd className="break-all">{check.actual ?? "—"}</dd>
            <dt className="text-muted-foreground">Expected</dt>
            <dd className="break-all">{check.expected ?? "—"}</dd>
          </dl>
        ) : null}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">×{check.weight}</span>
    </li>
  );
}

/** Failing checks first. */
export function CheckList({ checks }: { checks: SeoAuditCheck[] }) {
  const sorted = [...checks].sort((a, b) => Number(a.passed) - Number(b.passed));

  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
      {sorted.map((check) => (
        <CheckRow key={check.key} check={check} />
      ))}
    </ul>
  );
}
