"use client";

import { useId, type ReactNode } from "react";

import { keywordsToText, previewTitle, textToKeywords } from "@/components/admin/seo/seo-meta";
import { SeoDisclosure } from "@/components/admin/seo/seo-disclosure";
import { CharCount, SearchPreview, SocialPreview } from "@/components/admin/seo/seo-previews";
import { MediaChoiceField } from "@/components/media/media-choice";
import type { MediaChoice } from "@/components/media/media-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SeoFieldValues, SeoGlobalSettings, SeoOptions } from "@/lib/admin/seo-types";

const DEFAULT = "__default";

export type SeoFieldsContext = {
  /** Public URL of the record, used for canonical hints and previews. */
  url: string;
  /** Title used when meta title is empty (the page label or record name). */
  fallbackTitle: string;
  fallbackDescription?: string | null;
  fallbackImage?: string | null;
};

type Patch = Partial<SeoFieldValues>;

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const message = errors?.[name]?.[0];
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function Field({
  label,
  htmlFor,
  hint,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function OptionSelect({
  id,
  value,
  options,
  defaultLabel,
  disabled,
  onChange,
  format = (option) => option,
}: {
  id: string;
  value: string | null;
  options: readonly string[];
  defaultLabel?: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
  format?: (option: string) => string;
}) {
  return (
    <Select
      value={value ?? DEFAULT}
      onValueChange={(next) => onChange(next === DEFAULT ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {defaultLabel ? <SelectItem value={DEFAULT}>{defaultLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {format(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

function text(value: string) {
  return value === "" ? null : value;
}

/** Library images bring their alt text, or their title when the alt is empty. */
function imageAlt(url: string | null, choice: MediaChoice | undefined) {
  if (!url || !choice?.mediaId) return null;
  return text((choice.alt || choice.title || "").trim());
}

/**
 * The SEO field set for any page or record: search snippet, social card and
 * indexing. Used by the static-page editor and by detail-record forms.
 */
export function SeoFieldsSection({
  value,
  onChange,
  options,
  settings,
  context,
  disabled,
  errors,
}: {
  value: SeoFieldValues;
  onChange: (patch: Patch) => void;
  options: SeoOptions;
  settings: SeoGlobalSettings;
  context: SeoFieldsContext;
  disabled?: boolean;
  errors?: Record<string, string[]>;
}) {
  const id = useId();
  const title = previewTitle(value, settings, context.fallbackTitle);
  const description = value.meta_description?.trim() || context.fallbackDescription || settings.default_description || null;
  const ogTitle = value.og_title?.trim() || title;
  const ogDescription = value.og_description?.trim() || description;
  const ogImage = value.og_image || context.fallbackImage || settings.default_og_image || `${settings.site_url}/og`;
  const placeholders = options.placeholders.join(" ");
  const hasError = (...names: string[]) => names.some((name) => Boolean(errors?.[name]?.[0]));
  const searchCustomized =
    value.title_affix_mode !== "inherit" || Boolean(value.keywords?.length) || Boolean(value.author) || Boolean(value.canonical_url);
  const socialCustomized =
    Boolean(value.og_type) ||
    Boolean(value.twitter_card) ||
    Boolean(value.twitter_title) ||
    Boolean(value.twitter_description) ||
    Boolean(value.twitter_image);
  const indexingCustomized =
    value.sitemap_priority !== null ||
    Boolean(value.sitemap_changefreq) ||
    value.max_image_preview !== "large" ||
    Boolean(value.schema_type);

  return (
    <Tabs defaultValue="search" className="gap-5">
      <TabsList className="w-full">
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="indexing">Indexing</TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="flex flex-col gap-5">
        <SearchPreview title={title} description={description} url={context.url} siteName={settings.identity.name} />

        <Field
          label="Meta title"
          htmlFor={`${id}-title`}
          aside={<CharCount value={title} range={options.lengths.title} />}
          hint={`Empty uses “${context.fallbackTitle || settings.identity.name}”. The count is for the full title shown above.`}
        >
          <Input
            id={`${id}-title`}
            value={value.meta_title ?? ""}
            onChange={(event) => onChange({ meta_title: text(event.target.value) })}
            maxLength={255}
            disabled={disabled}
          />
          <FieldError errors={errors} name="meta_title" />
        </Field>

        <Field
          label="Meta description"
          htmlFor={`${id}-description`}
          aside={<CharCount value={value.meta_description ?? ""} range={options.lengths.description} />}
          hint={settings.default_description ? "Empty uses the site default description." : undefined}
        >
          <Textarea
            id={`${id}-description`}
            value={value.meta_description ?? ""}
            onChange={(event) => onChange({ meta_description: text(event.target.value) })}
            maxLength={500}
            rows={3}
            disabled={disabled}
          />
          <FieldError errors={errors} name="meta_description" />
        </Field>

        <SeoDisclosure
          title="Advanced"
          description="Title prefix and suffix, keywords, author and canonical URL."
          defaultOpen={searchCustomized}
          forceOpen={hasError("canonical_url", "title_prefix", "title_suffix")}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr]">
            <Field label="Title affix" htmlFor={`${id}-affix`}>
              <OptionSelect
                id={`${id}-affix`}
                value={value.title_affix_mode}
                options={options.affix_modes}
                disabled={disabled}
                onChange={(mode) => onChange({ title_affix_mode: (mode ?? "inherit") as SeoFieldValues["title_affix_mode"] })}
                format={(mode) => (mode === "inherit" ? "Site default" : mode === "custom" ? "Custom" : "None")}
              />
            </Field>
            {value.title_affix_mode === "custom" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prefix" htmlFor={`${id}-prefix`}>
                  <Input
                    id={`${id}-prefix`}
                    value={value.title_prefix ?? ""}
                    onChange={(event) => onChange({ title_prefix: text(event.target.value) })}
                    maxLength={120}
                    disabled={disabled}
                  />
                </Field>
                <Field label="Suffix" htmlFor={`${id}-suffix`}>
                  <Input
                    id={`${id}-suffix`}
                    value={value.title_suffix ?? ""}
                    onChange={(event) => onChange({ title_suffix: text(event.target.value) })}
                    maxLength={120}
                    disabled={disabled}
                  />
                </Field>
              </div>
            ) : (
              <p className="self-end pb-2 text-xs leading-5 text-muted-foreground">
                {value.title_affix_mode === "none"
                  ? "The title is used exactly as written."
                  : "Uses the site prefix and suffix from the global settings."}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Keywords" htmlFor={`${id}-keywords`} hint="Comma separated. Search engines mostly ignore them.">
              <Input
                id={`${id}-keywords`}
                defaultValue={keywordsToText(value.keywords)}
                onBlur={(event) => onChange({ keywords: textToKeywords(event.target.value) })}
                disabled={disabled}
              />
            </Field>
            <Field label="Author" htmlFor={`${id}-author`}>
              <Input
                id={`${id}-author`}
                value={value.author ?? ""}
                placeholder={settings.default_author || undefined}
                onChange={(event) => onChange({ author: text(event.target.value) })}
                maxLength={120}
                disabled={disabled}
              />
            </Field>
          </div>

          <Field
            label="Canonical URL"
            htmlFor={`${id}-canonical`}
            hint="Leave empty to point at this page. Set it only when another URL holds the same content."
          >
            <Input
              id={`${id}-canonical`}
              value={value.canonical_url ?? ""}
              placeholder={context.url}
              onChange={(event) => onChange({ canonical_url: text(event.target.value) })}
              maxLength={2048}
              disabled={disabled}
            />
            <FieldError errors={errors} name="canonical_url" />
          </Field>

          <p className="text-xs leading-5 text-muted-foreground">Placeholders: {placeholders}</p>
        </SeoDisclosure>
      </TabsContent>

      <TabsContent value="social" className="flex flex-col gap-5">
        <SocialPreview title={ogTitle} description={ogDescription} image={ogImage} url={context.url} />

        <Field label="Social title" htmlFor={`${id}-og-title`} hint="Empty uses the meta title.">
          <Input
            id={`${id}-og-title`}
            value={value.og_title ?? ""}
            onChange={(event) => onChange({ og_title: text(event.target.value) })}
            maxLength={255}
            disabled={disabled}
          />
        </Field>

        <Field label="Social description" htmlFor={`${id}-og-description`} hint="Empty uses the meta description.">
          <Textarea
            id={`${id}-og-description`}
            value={value.og_description ?? ""}
            onChange={(event) => onChange({ og_description: text(event.target.value) })}
            maxLength={500}
            rows={2}
            disabled={disabled}
          />
        </Field>

        <div className="space-y-2">
          <MediaChoiceField
            label="Social image"
            url={value.og_image}
            accept={["image"]}
            disabled={disabled}
            onChange={(url, choice) =>
              onChange({ og_image: url, og_image_alt: url === value.og_image ? value.og_image_alt : imageAlt(url, choice) })
            }
          />
          <p className="text-xs leading-5 text-muted-foreground">1200 × 630 works everywhere. Empty uses the site default.</p>
          <FieldError errors={errors} name="og_image" />
        </div>
        <Field
          label="Image alt text"
          htmlFor={`${id}-og-alt`}
          hint="Filled from the chosen image's alt text. Describe what the image shows."
        >
          <Input
            id={`${id}-og-alt`}
            value={value.og_image_alt ?? ""}
            onChange={(event) => onChange({ og_image_alt: text(event.target.value) })}
            maxLength={255}
            disabled={disabled}
          />
        </Field>

        <SeoDisclosure
          title="Advanced"
          description="Content type, and a separate title, description or image for X (Twitter)."
          defaultOpen={socialCustomized}
          forceOpen={hasError("twitter_image")}
        >
          <Field label="Content type" htmlFor={`${id}-og-type`}>
            <OptionSelect
              id={`${id}-og-type`}
              value={value.og_type}
              options={options.og_types}
              defaultLabel="Default"
              disabled={disabled}
              onChange={(next) => onChange({ og_type: next })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="X (Twitter) card" htmlFor={`${id}-twitter-card`}>
              <OptionSelect
                id={`${id}-twitter-card`}
                value={value.twitter_card}
                options={options.twitter_cards}
                defaultLabel="Default (large image)"
                disabled={disabled}
                onChange={(next) => onChange({ twitter_card: next })}
                format={(card) => (card === "summary" ? "Small image" : "Large image")}
              />
            </Field>
            <Field label="X title" htmlFor={`${id}-twitter-title`} hint="Empty uses the social title.">
              <Input
                id={`${id}-twitter-title`}
                value={value.twitter_title ?? ""}
                onChange={(event) => onChange({ twitter_title: text(event.target.value) })}
                maxLength={255}
                disabled={disabled}
              />
            </Field>
          </div>
          <Field label="X description" htmlFor={`${id}-twitter-description`} hint="Empty uses the social description.">
            <Textarea
              id={`${id}-twitter-description`}
              value={value.twitter_description ?? ""}
              onChange={(event) => onChange({ twitter_description: text(event.target.value) })}
              maxLength={500}
              rows={2}
              disabled={disabled}
            />
          </Field>
          <div className="space-y-2">
            <MediaChoiceField
              label="X image"
              url={value.twitter_image}
              accept={["image"]}
              disabled={disabled}
              onChange={(url) => onChange({ twitter_image: url })}
            />
            <FieldError errors={errors} name="twitter_image" />
          </div>
        </SeoDisclosure>
      </TabsContent>

      <TabsContent value="indexing" className="flex flex-col gap-4">
        <SwitchRow
          label="Allow search engines to index"
          description="Off adds noindex and removes the page from the sitemap."
          checked={value.robots_index}
          disabled={disabled}
          onChange={(checked) => onChange({ robots_index: checked })}
        />
        <SwitchRow
          label="Follow links on this page"
          description="Off adds nofollow, so links here pass no ranking signal."
          checked={value.robots_follow}
          disabled={disabled}
          onChange={(checked) => onChange({ robots_follow: checked })}
        />
        <SwitchRow
          label="List in the sitemap"
          description="Only indexable pages are listed, whatever this says."
          checked={value.in_sitemap}
          disabled={disabled}
          onChange={(checked) => onChange({ in_sitemap: checked })}
        />

        <SeoDisclosure
          title="Advanced"
          description="Sitemap priority and frequency, image preview size and structured data type."
          defaultOpen={indexingCustomized}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sitemap priority" htmlFor={`${id}-priority`}>
              <OptionSelect
                id={`${id}-priority`}
                value={value.sitemap_priority === null ? null : value.sitemap_priority.toFixed(1)}
                options={["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"]}
                defaultLabel="Default"
                disabled={disabled}
                onChange={(next) => onChange({ sitemap_priority: next === null ? null : Number(next) })}
              />
            </Field>
            <Field label="Change frequency" htmlFor={`${id}-changefreq`}>
              <OptionSelect
                id={`${id}-changefreq`}
                value={value.sitemap_changefreq}
                options={options.change_frequencies}
                defaultLabel="Default"
                disabled={disabled}
                onChange={(next) => onChange({ sitemap_changefreq: next })}
              />
            </Field>
            <Field label="Image preview" htmlFor={`${id}-image-preview`}>
              <OptionSelect
                id={`${id}-image-preview`}
                value={value.max_image_preview}
                options={options.image_previews}
                disabled={disabled}
                onChange={(next) => onChange({ max_image_preview: (next ?? "large") as SeoFieldValues["max_image_preview"] })}
              />
            </Field>
          </div>

          <Field label="Structured data type" htmlFor={`${id}-schema`} hint="The JSON-LD type search engines read for this page.">
            <OptionSelect
              id={`${id}-schema`}
              value={value.schema_type}
              options={options.schema_types}
              defaultLabel="Default for the page type"
              disabled={disabled}
              onChange={(next) => onChange({ schema_type: next })}
            />
          </Field>
        </SeoDisclosure>
      </TabsContent>
    </Tabs>
  );
}
