"use client";

import { ChartPie, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const MediaOverviewCharts = dynamic(() => import("@/components/admin/media/media-overview-charts"), {
  ssr: false,
});

/** Closed by default; the charts bundle loads on the first open so the gallery stays light. */
export function MediaOverview({ refreshKey }: { refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOpened(true);
      }}
      className="rounded-xl border border-border/70 bg-card/70"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="inline-flex items-center gap-2">
          <ChartPie className="size-4 text-muted-foreground" aria-hidden />
          Library overview
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      {/* Stays mounted after closing so reopening keeps the loaded charts. */}
      <CollapsibleContent forceMount className="px-4 pb-4 data-[state=closed]:hidden">
        {opened ? <MediaOverviewCharts refreshKey={refreshKey} /> : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
