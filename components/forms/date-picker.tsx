"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { DropdownProps, Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: Matcher | Matcher[];
  startMonth?: Date;
  endMonth?: Date;
  className?: string;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  startMonth,
  endMonth,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!value}
          className={cn("w-full justify-start font-normal data-[empty=true]:text-muted-foreground", className)}
        >
          <CalendarIcon data-icon="inline-start" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value ?? endMonth}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={disabled}
          components={{ Dropdown: CalendarDropdown }}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Month and year pickers as shadcn Selects instead of react-day-picker's native <select>. */
function CalendarDropdown({ options, value, onChange, disabled, "aria-label": ariaLabel }: DropdownProps) {
  return (
    <Select
      value={value === undefined ? undefined : String(value)}
      disabled={disabled}
      onValueChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
    >
      {/* `relative` keeps the trigger above the calendar's absolutely positioned nav. */}
      <SelectTrigger size="sm" aria-label={ariaLabel} className="relative font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="center" className="max-h-64 min-w-24">
        {options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
