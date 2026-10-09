"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { saveGeneralAction, saveSmtpAction } from "@/app/(admin)/admin/application/actions";
import FileUpload from "@/components/file-upload";
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
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set("name", name);
    formData.set("short_name", shortName);
    formData.set("registration_enabled", registration ? "1" : "0");
    formData.set("remove_logo", removeLogo ? "1" : "0");
    formData.set("remove_favicon", removeFavicon ? "1" : "0");
    if (logoFile) formData.set("logo", logoFile);
    if (faviconFile) formData.set("favicon", faviconFile);

    startTransition(async () => {
      const result = await saveGeneralAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved(result.settings);
      setRemoveLogo(false);
      setRemoveFavicon(false);
      setLogoFile(null);
      setFaviconFile(null);
      toast.success(result.message);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-6 rounded-xl border border-border/70 bg-card/70 p-6">
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
        <BrandField
          label="Logo"
          url={removeLogo ? null : general.logo_url}
          file={logoFile}
          disabled={pending}
          onChange={setLogoFile}
          onRemove={() => setRemoveLogo(true)}
        />
        <BrandField
          label="Favicon"
          url={removeFavicon ? null : general.favicon_url}
          file={faviconFile}
          disabled={pending}
          onChange={setFaviconFile}
          onRemove={() => setRemoveFavicon(true)}
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

function mimeFromUrl(url: string) {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "image/png";
}

function BrandField({
  label,
  url,
  file,
  disabled,
  onChange,
  onRemove,
}: {
  label: string;
  url: string | null;
  file: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const existing = url
    ? [
        {
          id: label,
          path: url,
          url,
          mime_type: mimeFromUrl(url),
          name: label,
        },
      ]
    : [];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <FileUpload
        value={file}
        onChange={(next) => onChange(Array.isArray(next) ? (next[0] ?? null) : next)}
        existingFiles={existing}
        onRemoveExisting={onRemove}
        accept="image/*,.svg,.ico"
        maxSize={2}
        placeholder="Add image"
        disabled={disabled}
        lightbox
        layout="inline"
        classNames={{
          dropzone: "flex-row items-center justify-start gap-3 px-3 py-2.5",
          dropzoneContent: "w-auto flex-row flex-wrap items-center justify-start gap-x-2 gap-y-0 text-left [&_svg]:size-4",
        }}
      />
    </div>
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
