"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveSeoPageAction } from "@/app/(admin)/admin/application/seo/actions";
import { PAGE_TYPE_LABELS } from "@/components/admin/seo/seo-meta";
import { SeoFieldsSection } from "@/components/admin/seo/seo-fields-section";
import { SideSheet } from "@/components/overlay/side-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_SEO_FIELDS,
  type SeoFieldValues,
  type SeoGlobalSettings,
  type SeoOptions,
  type SeoPageEntry,
} from "@/lib/admin/seo-types";

function fieldsOf(page: SeoPageEntry | null): SeoFieldValues {
  if (!page) return EMPTY_SEO_FIELDS;
  return Object.fromEntries(
    Object.keys(EMPTY_SEO_FIELDS).map((key) => [key, page.fields[key as keyof SeoFieldValues]]),
  ) as SeoFieldValues;
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

export function SeoPageEditor({
  page,
  open,
  settings,
  options,
  onOpenChange,
  onSaved,
}: {
  /** null adds a new page. */
  page: SeoPageEntry | null;
  open: boolean;
  settings: SeoGlobalSettings;
  options: SeoOptions;
  onOpenChange: (open: boolean) => void;
  onSaved: (page: SeoPageEntry, created: boolean) => void;
}) {
  const [path, setPath] = useState(page?.path ?? "/");
  const [label, setLabel] = useState(page?.label ?? "");
  const [pageType, setPageType] = useState(page?.page_type ?? "other");
  const [fields, setFields] = useState<SeoFieldValues>(() => fieldsOf(page));
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>();
  const [pending, startTransition] = useTransition();
  const locked = page?.is_system ?? false;
  const fallbackTitle = pageType === "home" ? settings.identity.name : label || page?.label || "";

  function save() {
    startTransition(async () => {
      const result = await saveSeoPageAction(page?.id ?? null, {
        ...(locked ? {} : { path }),
        label,
        page_type: pageType,
        ...fields,
      });
      if (!result.ok) {
        setErrors(result.errors);
        toast.error(result.message);
        return;
      }
      setErrors(undefined);
      toast.success(result.message);
      onSaved(result.page, page === null);
    });
  }

  return (
    <SideSheet
      open={open}
      onOpenChange={onOpenChange}
      title={page ? `SEO · ${page.label}` : "Add page"}
      description={page ? page.path : "Register a public path so it gets its own meta tags and a sitemap entry."}
      className="data-[side=right]:sm:max-w-2xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={pending || label.trim() === ""}>
            {pending ? "Saving…" : page ? "Save page" : "Add page"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_10rem]">
          <div className="space-y-2">
            <Label htmlFor="seo-page-path">Path</Label>
            <Input
              id="seo-page-path"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              disabled={locked || pending}
              placeholder="/about"
              maxLength={255}
            />
            {errors?.path?.[0] ? (
              <p className="text-xs text-destructive">{errors.path[0]}</p>
            ) : locked ? (
              <p className="text-xs text-muted-foreground">Built-in page. The path is fixed.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-page-label">Name</Label>
            <Input
              id="seo-page-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              disabled={pending}
              placeholder="About"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-page-type">Page type</Label>
            <Select value={pageType} onValueChange={setPageType} disabled={pending}>
              <SelectTrigger id="seo-page-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.page_types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PAGE_TYPE_LABELS[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SeoFieldsSection
          value={fields}
          onChange={(patch) => setFields((current) => ({ ...current, ...patch }))}
          options={options}
          settings={settings}
          context={{
            url: joinUrl(settings.site_url, path.startsWith("/") ? path : `/${path}`),
            fallbackTitle,
          }}
          disabled={pending}
          errors={errors}
        />
      </div>
    </SideSheet>
  );
}
