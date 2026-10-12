"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { saveGeneralAction, saveSmtpAction } from "@/app/(admin)/admin/application/actions";
import { MediaChoiceField } from "@/components/media/media-choice";
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
import { Switch } from "@/components/ui/switch";
import type { AdminSettings, SmtpEncryption } from "@/lib/settings/admin";

const sections = {
  general: {
    title: "General",
    description: "Name, logo, favicon, and who can register.",
  },
  smtp: {
    title: "SMTP",
    description: "Mail sent by the app. Empty settings keep the server environment.",
  },
  seo: {
    title: "SEO",
    description: "Titles, descriptions and social cards for every public page, plus the sitemap and robots.txt.",
  },
  "seo-health": {
    title: "SEO health",
    description: "A real scan of the rendered pages: meta tags, headings, links, images and speed.",
  },
  backup: {
    title: "Database backup",
    description: "A database backup every night, kept for 14 days. Back up, restore, or download on demand.",
  },
  audit: {
    title: "Audit",
    description: "Every sign-in, security change, record edit, settings change, upload and backup across the site.",
  },
} as const;

export type ApplicationSection = keyof typeof sections;

const RETENTION_PRESETS = [
  { days: 30, label: "1 month" },
  { days: 90, label: "3 months" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
  { days: 730, label: "2 years" },
];

export function ApplicationSectionHeader({
  section,
  children,
}: {
  section: ApplicationSection;
  children?: ReactNode;
}) {
  const copy = sections[section];

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Application settings</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
      </div>
      {children}
    </div>
  );
}

export function ApplicationSettingsScreen({
  initial,
  section,
}: {
  initial: AdminSettings;
  section: ApplicationSection;
}) {
  const [settings, setSettings] = useState(initial);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ApplicationSectionHeader section={section} />

      {section === "general" ? (
        <GeneralForm settings={settings} onSaved={setSettings} />
      ) : null}
      {section === "smtp" ? (
        <SmtpForm settings={settings} onSaved={setSettings} />
      ) : null}
    </div>
  );
}

function GeneralForm({
  settings,
  onSaved,
}: {
  settings: AdminSettings;
  onSaved: (settings: AdminSettings) => void;
}) {
  const general = settings.general;
  const [name, setName] = useState(general.name);
  const [shortName, setShortName] = useState(general.short_name);
  const [registration, setRegistration] = useState(general.registration_enabled);
  const [logoUrl, setLogoUrl] = useState(general.logo_url);
  const [faviconUrl, setFaviconUrl] = useState(general.favicon_url);
  const [retention, setRetention] = useState(String(general.audit_retention_days ?? 180));
  const [pending, startTransition] = useTransition();
  const retentionOptions = RETENTION_PRESETS.some((preset) => String(preset.days) === retention)
    ? RETENTION_PRESETS
    : [...RETENTION_PRESETS, { days: Number(retention), label: `${retention} days` }].sort((a, b) => a.days - b.days);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveGeneralAction({
        name,
        short_name: shortName,
        registration_enabled: registration,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        audit_retention_days: Number(retention),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved(result.settings);
      setLogoUrl(result.settings.general.logo_url);
      setFaviconUrl(result.settings.general.favicon_url);
      toast.success(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="app-name">Application name</Label>
          <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="app-short-name">Short name</Label>
          <Input id="app-short-name" value={shortName} onChange={(event) => setShortName(event.target.value)} maxLength={40} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaChoiceField
          label="Logo"
          url={logoUrl}
          accept={["image"]}
          disabled={pending}
          onChange={setLogoUrl}
        />
        <MediaChoiceField
          label="Favicon"
          url={faviconUrl}
          accept={["image"]}
          disabled={pending}
          onChange={setFaviconUrl}
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
        <div>
          <p className="text-sm font-medium">Public registration</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When this is off, the register page and the sign-up link are hidden.
          </p>
        </div>
        <Switch checked={registration} onCheckedChange={setRegistration} aria-label="Public registration" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label htmlFor="audit-retention" className="text-sm font-medium">
            Audit log retention
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Older audit entries are deleted every night. Between 1 month and 2 years.
          </p>
        </div>
        <Select value={retention} onValueChange={setRetention} disabled={pending}>
          <SelectTrigger id="audit-retention" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {retentionOptions.map((option) => (
              <SelectItem key={option.days} value={String(option.days)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save general"}
      </Button>
    </form>
  );
}

function SmtpForm({
  settings,
  onSaved,
}: {
  settings: AdminSettings;
  onSaved: (settings: AdminSettings) => void;
}) {
  const smtp = settings.smtp;
  const [enabled, setEnabled] = useState(smtp.enabled);
  const [host, setHost] = useState(smtp.host);
  const [port, setPort] = useState(String(smtp.port || 587));
  const [encryption, setEncryption] = useState<SmtpEncryption>(smtp.encryption);
  const [username, setUsername] = useState(smtp.username);
  const [password, setPassword] = useState("");
  const [fromAddress, setFromAddress] = useState(smtp.from_address);
  const [fromName, setFromName] = useState(smtp.from_name);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSmtpAction({
        enabled,
        host,
        port: Number(port) || 587,
        encryption,
        username,
        password,
        from_address: fromAddress,
        from_name: fromName,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved(result.settings);
      setPassword("");
      toast.success(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-xl border border-border/70 bg-card/70 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Use database SMTP</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Off means outgoing mail keeps the server environment. On replaces it for the next message.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable SMTP" />
      </div>

      {enabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtp-host">Host</Label>
            <Input id="smtp-host" value={host} onChange={(event) => setHost(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">Port</Label>
            <Input id="smtp-port" inputMode="numeric" value={port} onChange={(event) => setPort(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-encryption">Encryption</Label>
            <Select
              value={encryption}
              onValueChange={(value) => setEncryption(value as SmtpEncryption)}
            >
              <SelectTrigger id="smtp-encryption" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-username">Username</Label>
            <Input id="smtp-username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-password">Password</Label>
            <Input
              id="smtp-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={smtp.password_set ? "Saved. Leave blank to keep it." : "Password"}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-from">From address</Label>
            <Input id="smtp-from" type="email" value={fromAddress} onChange={(event) => setFromAddress(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-from-name">From name</Label>
            <Input id="smtp-from-name" value={fromName} onChange={(event) => setFromName(event.target.value)} />
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save mail"}
      </Button>
    </form>
  );
}
