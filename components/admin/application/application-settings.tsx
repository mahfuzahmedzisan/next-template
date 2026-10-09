"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { saveGeneralAction, saveSmtpAction } from "@/app/(admin)/admin/application/actions";
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
import { cn } from "@/lib/utils";

const tabs = [
  { id: "general", label: "General" },
  { id: "smtp", label: "SMTP" },
  { id: "backup", label: "Database backup" },
  { id: "audit", label: "Audit" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function isTab(value: string | null): value is TabId {
  return tabs.some((tab) => tab.id === value);
}

export function ApplicationSettingsScreen({ initial }: { initial: AdminSettings }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: TabId = isTab(requested) ? requested : "general";
  const [settings, setSettings] = useState(initial);

  function selectTab(next: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "general") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
          Application settings
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Values saved here are used at runtime. Empty mail settings keep the server environment.
        </p>
      </div>

      <div role="tablist" aria-label="Application settings" className="flex flex-wrap gap-1 rounded-xl bg-muted/70 p-1">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(item.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "general" ? (
        <GeneralForm settings={settings} onSaved={setSettings} />
      ) : null}
      {tab === "smtp" ? (
        <SmtpForm settings={settings} onSaved={setSettings} />
      ) : null}
      {tab === "backup" ? (
        <EmptyTab
          title="Database backup"
          body="Scheduled dumps and restore points are not set up yet. This tab is reserved for that."
        />
      ) : null}
      {tab === "audit" ? (
        <EmptyTab
          title="Audit"
          body="An activity log is not set up yet. This tab is reserved for sign-in and settings changes."
        />
      ) : null}
    </div>
  );
}

function EmptyTab({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/70 p-6">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </section>
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
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set("name", name);
    formData.set("short_name", shortName);
    formData.set("registration_enabled", registration ? "1" : "0");
    formData.set("remove_logo", removeLogo ? "1" : "0");
    formData.set("remove_favicon", removeFavicon ? "1" : "0");

    startTransition(async () => {
      const result = await saveGeneralAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved(result.settings);
      setRemoveLogo(false);
      setRemoveFavicon(false);
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

      <BrandField
        label="Logo"
        name="logo"
        url={removeLogo ? null : general.logo_url}
        onRemove={() => setRemoveLogo(true)}
      />
      <BrandField
        label="Favicon"
        name="favicon"
        url={removeFavicon ? null : general.favicon_url}
        onRemove={() => setRemoveFavicon(true)}
      />

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

function BrandField({
  label,
  name,
  url,
  onRemove,
}: {
  label: string;
  name: string;
  url: string | null;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- stored brand file, not a remote optimizer target
          <img src={url} alt="" className="size-12 rounded-md border object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">No {label.toLowerCase()} yet.</span>
        )}
        <Input id={name} name={name} type="file" accept="image/*,.ico" className="max-w-xs" />
        {url ? (
          <Button type="button" variant="outline" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>
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
