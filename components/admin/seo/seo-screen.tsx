"use client";

import { useState } from "react";

import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { SeoFilesCard } from "@/components/admin/seo/seo-files-card";
import { needsAttention, type SeoTab } from "@/components/admin/seo/seo-meta";
import { SeoPagesList } from "@/components/admin/seo/seo-pages-list";
import { SeoSettingsForm } from "@/components/admin/seo/seo-settings-form";
import { SeoTypeDefaults } from "@/components/admin/seo/seo-type-defaults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { SeoOverview, SeoPageEntry } from "@/lib/admin/seo-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";

/** Inactive panels stay mounted (hidden) so unsaved edits survive a tab switch. */
const PANEL = "data-[state=inactive]:hidden";

export function SeoScreen({
  initial,
  openPageId,
  initialTab,
}: {
  initial: SeoOverview;
  openPageId: number | null;
  initialTab: SeoTab;
}) {
  const [overview, setOverview] = useState(initial);
  const hasTypes = overview.types.length > 0;
  const [tab, setTab] = useState<SeoTab>(initialTab === "types" && !hasTypes ? "pages" : initialTab);
  const timeZone = useDisplayTimeZone();
  const attention = overview.pages.filter(needsAttention).length;

  function changeTab(value: string) {
    const next = value as SeoTab;
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    if (next === "pages") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function upsertPage(page: SeoPageEntry) {
    setOverview((current) => {
      const exists = current.pages.some((entry) => entry.id === page.id);
      const pages = exists
        ? current.pages.map((entry) => (entry.id === page.id ? page : entry))
        : [...current.pages, page].sort(
            (a, b) => Number(b.is_system) - Number(a.is_system) || a.path.localeCompare(b.path),
          );
      return { ...current, pages };
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ApplicationSectionHeader section="seo">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/application/seo-health">Open SEO health</Link>
        </Button>
      </ApplicationSectionHeader>

      <Tabs value={tab} onValueChange={changeTab} className="gap-5">
        <TabsList className="h-auto! w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="pages" className="px-3">
            Pages
            {attention > 0 ? (
              <span
                className="rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-300"
                aria-label={`${attention} need attention`}
              >
                {attention}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="defaults" className="px-3">
            Site defaults
          </TabsTrigger>
          {hasTypes ? (
            <TabsTrigger value="types" className="px-3">
              Content types
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="files" className="px-3">
            Sitemap &amp; robots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" forceMount className={PANEL}>
          <SeoPagesList
            overview={overview}
            timeZone={timeZone}
            openPageId={openPageId}
            onOverview={setOverview}
            onPage={upsertPage}
          />
        </TabsContent>
        <TabsContent value="defaults" forceMount className={PANEL}>
          <SeoSettingsForm key={overview.settings.site_url} overview={overview} onSaved={setOverview} />
        </TabsContent>
        {hasTypes ? (
          <TabsContent value="types" forceMount className={PANEL}>
            <SeoTypeDefaults overview={overview} onSaved={setOverview} />
          </TabsContent>
        ) : null}
        <TabsContent value="files" forceMount className={PANEL}>
          <SeoFilesCard
            files={overview.files}
            timeZone={timeZone}
            onFiles={(files) => setOverview((current) => ({ ...current, files }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
