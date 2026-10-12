"use client";

import { useState } from "react";

import { ApplicationSectionHeader } from "@/components/admin/application/application-settings";
import { SeoFilesCard } from "@/components/admin/seo/seo-files-card";
import { SeoPagesList } from "@/components/admin/seo/seo-pages-list";
import { SeoSettingsForm } from "@/components/admin/seo/seo-settings-form";
import { SeoTypeDefaults } from "@/components/admin/seo/seo-type-defaults";
import { Button } from "@/components/ui/button";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import type { SeoOverview, SeoPageEntry } from "@/lib/admin/seo-types";
import { useDisplayTimeZone } from "@/lib/datetime/timezone";

export function SeoScreen({ initial, openPageId }: { initial: SeoOverview; openPageId: number | null }) {
  const [overview, setOverview] = useState(initial);
  const timeZone = useDisplayTimeZone();

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

      <SeoFilesCard
        files={overview.files}
        timeZone={timeZone}
        onFiles={(files) => setOverview((current) => ({ ...current, files }))}
      />
      <SeoPagesList
        overview={overview}
        timeZone={timeZone}
        openPageId={openPageId}
        onOverview={setOverview}
        onPage={upsertPage}
      />
      <SeoSettingsForm key={overview.settings.site_url} overview={overview} onSaved={setOverview} />
      <SeoTypeDefaults overview={overview} onSaved={setOverview} />
    </div>
  );
}
