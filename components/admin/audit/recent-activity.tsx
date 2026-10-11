"use client";

import { ActivityTimeline } from "@/components/admin/audit/activity-timeline";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { Button } from "@/components/ui/button";
import type { AuditEntry } from "@/lib/admin/audit-types";

export function RecentActivity({ entries, total }: { entries: AuditEntry[]; total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <ActivityTimeline
        entries={entries}
        dense
        showActor={false}
        emptyTitle="No recent activity"
        emptyText="Sign-ins and security changes on this account appear here."
      />
      {total > entries.length ? (
        <Button variant="outline" size="sm" className="self-start" asChild>
          <Link href="/admin/activity">View all activity</Link>
        </Button>
      ) : null}
    </div>
  );
}
