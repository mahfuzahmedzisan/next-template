"use client";

import { useState, useTransition, type FormEvent } from "react";
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
  backup: {
    title: "Database backup",
    description: "Scheduled dumps and restore points are not set up yet.",
  },
  audit: {
    title: "Audit",
    description: "An activity log is not set up yet. This page is reserved for sign-in and settings changes.",
  },
} as const;

export type ApplicationSection = keyof typeof sections;

export function ApplicationSettingsScreen({
  initial,
  section,
}: {
  initial: AdminSettings;
  section: ApplicationSection;
}) {
  const [settings, setSettings] = useState(initial);
  const copy = sections[section];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Application settings</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
      </div>

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
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveGeneralAction({
        name,
        short_name: shortName,
        registration_enabled: registration,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
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
