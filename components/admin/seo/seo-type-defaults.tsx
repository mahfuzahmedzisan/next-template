"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveSeoTypeAction } from "@/app/(admin)/admin/application/seo/actions";
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
import { Textarea } from "@/components/ui/textarea";
import type { SeoOptions, SeoOverview, SeoTypeEntry, SeoTypeTemplate } from "@/lib/admin/seo-types";

const DEFAULT = "__default";

function TemplateSelect({
  id,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  value: string | null | undefined;
  options: readonly string[];
  disabled: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select value={value ?? DEFAULT} onValueChange={(next) => onChange(next === DEFAULT ? null : next)} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT}>Default</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TypeForm({
  entry,
  options,
  onSaved,
}: {
  entry: SeoTypeEntry;
  options: SeoOptions;
  onSaved: (overview: SeoOverview) => void;
}) {
  const [template, setTemplate] = useState<SeoTypeTemplate>(entry.template);
  const [pending, startTransition] = useTransition();
  const id = `seo-type-${entry.type}`;
  const set = (patch: SeoTypeTemplate) => setTemplate((current) => ({ ...current, ...patch }));

  function save() {
    startTransition(async () => {
      const result = await saveSeoTypeAction(entry.type, template);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved(result.overview);
      toast.success(result.message);
    });
  }

  return (
    <li className="flex flex-col gap-4 p-4">
      <p className="text-sm font-medium">{entry.label}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-title`}>Title template</Label>
          <Input
            id={`${id}-title`}
            value={template.title_template ?? ""}
            onChange={(event) => set({ title_template: event.target.value || null })}
            placeholder="{{page_title}} - {{site_name}}"
            maxLength={160}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-og`}>Social type</Label>
            <TemplateSelect
              id={`${id}-og`}
              value={template.og_type}
              options={options.og_types}
              disabled={pending}
              onChange={(og_type) => set({ og_type })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-schema`}>Schema</Label>
            <TemplateSelect
              id={`${id}-schema`}
              value={template.schema_type}
              options={options.schema_types}
              disabled={pending}
              onChange={(schema_type) => set({ schema_type })}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-description`}>Fallback description</Label>
        <Textarea
          id={`${id}-description`}
          value={template.description ?? ""}
          onChange={(event) => set({ description: event.target.value || null })}
          rows={2}
          maxLength={500}
          disabled={pending}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[10rem_10rem_1fr] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={`${id}-priority`}>Sitemap priority</Label>
          <TemplateSelect
            id={`${id}-priority`}
            value={template.sitemap_priority === null || template.sitemap_priority === undefined ? null : template.sitemap_priority.toFixed(1)}
            options={["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"]}
            disabled={pending}
            onChange={(next) => set({ sitemap_priority: next === null ? null : Number(next) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-changefreq`}>Change frequency</Label>
          <TemplateSelect
            id={`${id}-changefreq`}
            value={template.sitemap_changefreq}
            options={options.change_frequencies}
            disabled={pending}
            onChange={(sitemap_changefreq) => set({ sitemap_changefreq })}
          />
        </div>
        <Button type="button" variant="secondary" onClick={save} disabled={pending} className="justify-self-start">
          {pending ? "Saving…" : `Save ${entry.label.toLowerCase()} defaults`}
        </Button>
      </div>
    </li>
  );
}

/** Defaults for detail pages of each content type; a record's own SEO fields win. */
export function SeoTypeDefaults({
  overview,
  onSaved,
}: {
  overview: SeoOverview;
  onSaved: (overview: SeoOverview) => void;
}) {
  if (overview.types.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-6">
      <div>
        <h3 className="text-base font-semibold">Content-type defaults</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Used by detail pages that leave a field empty. Placeholders: {overview.options.placeholders.join(" ")}
        </p>
      </div>
      <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
        {overview.types.map((entry) => (
          <TypeForm key={entry.type} entry={entry} options={overview.options} onSaved={onSaved} />
        ))}
      </ul>
    </section>
  );
}
