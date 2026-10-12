"use client";

import { subDays } from "date-fns";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { humanizeKey, zonedDay, zonedDayBoundary } from "@/components/admin/audit/audit-meta";
import { DatePicker } from "@/components/forms/date-picker";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuditOption, AuditOverview } from "@/lib/admin/audit-types";
import { dateToDay, dayToDate } from "@/lib/datetime/day";

export type AuditFilters = Partial<
  Record<
    "q" | "category" | "severity" | "event" | "causer" | "subject" | "involving" | "ip" | "request_id" | "origin" | "from" | "to",
    string
  >
>;

type EventGroup = { value: string; items: AuditOption[] };

/** Filters set by links (a request id, a user, a record) rather than the controls. */
const PINNED: (keyof AuditFilters)[] = ["request_id", "subject", "causer", "involving", "ip", "origin"];

const SEARCH_DELAY_MS = 350;

/** Matches the longest retention setting, so older days are never offered. */
const DATE_RANGE_YEARS = 2;

const LABEL_CLASS = "text-xs text-muted-foreground";

const optionLabel = (option: AuditOption) => option.label;
const optionValue = (option: AuditOption) => option.value;
const sameOption = (a: AuditOption, b: AuditOption) => a.value === b.value;

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
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (query.trim() === applied.current) return;
    const timer = window.setTimeout(() => {
      applied.current = query.trim();
      onChange({ q: query.trim() });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, onChange]);

  const eventGroups: EventGroup[] = [
    ...options.categories
      .filter((category) => !filters.category || category.value === filters.category)
      .map((category) => ({
        value: category.label,
        items: options.events.filter((event) => event.category === category.value),
      })),
    { value: "Record changes", items: options.events.filter((event) => event.category === null) },
  ].filter((group) => group.items.length > 0);

  const selectedCategory = options.categories.find((category) => category.value === filters.category) ?? null;
  const selectedEvent = options.events.find((event) => event.value === filters.event) ?? null;

  const today = dayToDate(zonedDay(now.toISOString(), timeZone)) ?? now;
  const startMonth = new Date(today.getFullYear() - DATE_RANGE_YEARS, today.getMonth(), 1);
  const from = dayToDate(zonedDay(filters.from ?? null, timeZone));
  const to = dayToDate(zonedDay(filters.to ?? null, timeZone));
  const yesterday = subDays(today, 1);
  const fromPresets = [
    { label: "Today", date: today },
    { label: "Yesterday", date: yesterday },
    { label: "Last 7 days", date: subDays(today, 6) },
    { label: "Last 30 days", date: subDays(today, 29) },
  ];
  const toPresets = [
    { label: "Today", date: today },
    { label: "Yesterday", date: yesterday },
  ];

  const pinned = PINNED.filter((key) => filters[key]);
  const active = Object.entries(filters).some(([, value]) => Boolean(value));

  return (
    <div className="flex flex-col gap-3">
      <FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <Field className="md:col-span-2 xl:col-span-1">
          <FieldLabel htmlFor="audit-search" className={LABEL_CLASS}>
            Search
          </FieldLabel>
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
        </Field>

        <Field>
          <FieldLabel htmlFor="audit-category" className={LABEL_CLASS}>
            Category
          </FieldLabel>
          <Combobox
            items={options.categories}
            value={selectedCategory}
            onValueChange={(category: AuditOption | null) =>
              onChange({ category: category?.value, event: undefined })
            }
            itemToStringLabel={optionLabel}
            itemToStringValue={optionValue}
            isItemEqualToValue={sameOption}
            autoHighlight
          >
            <ComboboxInput id="audit-category" placeholder="All categories" className="h-9 w-full" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No categories found.</ComboboxEmpty>
              <ComboboxList>
                {(category: AuditOption) => (
                  <ComboboxItem key={category.value} value={category}>
                    {category.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        <Field>
          <FieldLabel htmlFor="audit-event" className={LABEL_CLASS}>
            Event
          </FieldLabel>
          <Combobox
            items={eventGroups}
            value={selectedEvent}
            onValueChange={(event: AuditOption | null) => onChange({ event: event?.value })}
            itemToStringLabel={optionLabel}
            itemToStringValue={optionValue}
            isItemEqualToValue={sameOption}
            autoHighlight
          >
            <ComboboxInput id="audit-event" placeholder="All events" className="h-9 w-full" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No events found.</ComboboxEmpty>
              <ComboboxList>
                {(group: EventGroup) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxLabel>{group.value}</ComboboxLabel>
                    <ComboboxCollection>
                      {(event: AuditOption) => (
                        <ComboboxItem key={event.value} value={event}>
                          {event.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                    <ComboboxSeparator />
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        <Field>
          <FieldLabel htmlFor="audit-severity" className={LABEL_CLASS}>
            Severity
          </FieldLabel>
          <Select
            value={filters.severity || "all"}
            onValueChange={(next) => onChange({ severity: next === "all" ? undefined : next })}
          >
            <SelectTrigger id="audit-severity" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">Any severity</SelectItem>
              <SelectItem value="warning,critical">Warning and critical</SelectItem>
              {options.severities.map((severity) => (
                <SelectItem key={severity.value} value={severity.value}>
                  {severity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-48">
          <FieldLabel htmlFor="audit-from" className={LABEL_CLASS}>
            From
          </FieldLabel>
          <DatePicker
            id="audit-from"
            className="h-9"
            placeholder="Any date"
            value={from}
            onChange={(date) =>
              onChange({ from: date ? (zonedDayBoundary(dateToDay(date), timeZone) ?? undefined) : undefined })
            }
            disabled={{ after: to ?? today }}
            startMonth={startMonth}
            endMonth={today}
            presets={fromPresets}
          />
        </Field>
        <Field className="w-48">
          <FieldLabel htmlFor="audit-to" className={LABEL_CLASS}>
            To
          </FieldLabel>
          <DatePicker
            id="audit-to"
            className="h-9"
            placeholder="Any date"
            value={to}
            onChange={(date) =>
              onChange({ to: date ? (zonedDayBoundary(dateToDay(date), timeZone, true) ?? undefined) : undefined })
            }
            disabled={from ? [{ before: from }, { after: today }] : { after: today }}
            startMonth={startMonth}
            endMonth={today}
            presets={toPresets}
          />
        </Field>

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
