"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { humanizeKey, zonedDay, zonedDayBoundary } from "@/components/admin/audit/audit-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditOverview } from "@/lib/admin/audit-types";

export type AuditFilters = Partial<
  Record<
    "q" | "category" | "severity" | "event" | "causer" | "subject" | "involving" | "ip" | "request_id" | "origin" | "from" | "to",
    string
  >
>;

/** Filters set by links (a request id, a user, a record) rather than the controls. */
const PINNED: (keyof AuditFilters)[] = ["request_id", "subject", "causer", "involving", "ip", "origin"];

const SEARCH_DELAY_MS = 350;

export function AuditFiltersBar({
  filters,
  options,
  timeZone,
  onChange,
}: {
  filters: AuditFilters;
  options: AuditOverview["options"];
  timeZone: string;
  onChange: (patch: AuditFilters) => void;
}) {
  const [query, setQuery] = useState(filters.q ?? "");
  const applied = useRef(filters.q ?? "");

  useEffect(() => {
    if (query.trim() === applied.current) return;
    const timer = window.setTimeout(() => {
      applied.current = query.trim();
      onChange({ q: query.trim() });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, onChange]);

  const eventGroups = options.categories
    .map((category) => ({
      ...category,
      events: options.events.filter((event) => event.category === category.value),
    }))
    .filter((group) => group.events.length > 0);
  const recordEvents = options.events.filter((event) => event.category === null);

  const pinned = PINNED.filter((key) => filters[key]);
  const active = Object.entries(filters).some(([, value]) => Boolean(value));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <Label htmlFor="audit-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <InputGroup className="h-9">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="audit-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, record, IP or summary"
              maxLength={120}
            />
          </InputGroup>
        </div>

        <FilterSelect
          id="audit-category"
          label="Category"
          value={filters.category}
          onChange={(value) => onChange({ category: value, event: undefined })}
        >
          <SelectItem value="all">All categories</SelectItem>
          {options.categories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          id="audit-event"
          label="Event"
          value={filters.event}
          onChange={(value) => onChange({ event: value })}
        >
          <SelectItem value="all">All events</SelectItem>
          {eventGroups
            .filter((group) => !filters.category || group.value === filters.category)
            .map((group) => (
              <SelectGroup key={group.value}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.events.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          <SelectGroup>
            <SelectLabel>Record changes</SelectLabel>
            {recordEvents.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </FilterSelect>

        <FilterSelect
          id="audit-severity"
          label="Severity"
          value={filters.severity}
          onChange={(value) => onChange({ severity: value })}
        >
          <SelectItem value="all">Any severity</SelectItem>
          <SelectItem value="warning,critical">Warning and critical</SelectItem>
          {options.severities.map((severity) => (
            <SelectItem key={severity.value} value={severity.value}>
              {severity.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audit-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="audit-from"
            type="date"
            className="h-9 w-40"
            value={zonedDay(filters.from ?? null, timeZone)}
            max={zonedDay(filters.to ?? null, timeZone) || undefined}
            onChange={(event) =>
              onChange({ from: event.target.value ? zonedDayBoundary(event.target.value, timeZone) ?? undefined : undefined })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audit-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="audit-to"
            type="date"
            className="h-9 w-40"
            value={zonedDay(filters.to ?? null, timeZone)}
            min={zonedDay(filters.from ?? null, timeZone) || undefined}
            onChange={(event) =>
              onChange({ to: event.target.value ? zonedDayBoundary(event.target.value, timeZone, true) ?? undefined : undefined })
            }
          />
        </div>

        {pinned.map((key) => (
          <span
            key={key}
            className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 pl-3 pr-1 text-xs"
          >
            <span className="text-muted-foreground">{humanizeKey(key)}:</span>
            <span className="max-w-48 truncate font-medium">{filters[key]}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${humanizeKey(key)} filter`}
              onClick={() => onChange({ [key]: undefined })}
            >
              <X aria-hidden />
            </Button>
          </span>
        ))}

        {active ? (
          <Button
            type="button"
            variant="ghost"
            className="h-9"
            onClick={() => {
              setQuery("");
              applied.current = "";
              onChange(Object.fromEntries(Object.keys(filters).map((key) => [key, undefined])));
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? undefined : next)}>
        <SelectTrigger id={id} className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">{children}</SelectContent>
      </Select>
    </div>
  );
}
