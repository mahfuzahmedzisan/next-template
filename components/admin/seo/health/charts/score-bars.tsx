"use client";

import { HorizontalBars, type HorizontalBarsProps } from "@/components/admin/charts/horizontal-bars";
import { scoreFill } from "@/components/admin/seo/health/health-meta";

/** Horizontal bars coloured by score band, so 0–100 scores need no `fill`. */
export function ScoreBars(props: Omit<HorizontalBarsProps, "defaultFill">) {
  return <HorizontalBars {...props} defaultFill={scoreFill} />;
}
