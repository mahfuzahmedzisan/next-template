"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import { extensionOf } from "@/lib/media/accept";
import type { MediaKind } from "@/lib/media/types";

export function MediaChoiceField({
  label,
  url,
  accept,
  max = 1,
  disabled,
  onChange,
}: {
  label: string;
  url: string | null;
  accept: MediaKind[];
  max?: number;
  disabled?: boolean;
  onChange: (url: string | null, choice?: MediaChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const value: MediaChoice[] = url ? [{ url, title: label }] : [];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {url ? (
        <div className="flex h-14 w-full items-center gap-3 rounded-lg border bg-card px-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
              {/* Brand files are served from this app, including external URLs the picker stored. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted-foreground uppercase">
                {extensionOf(url) || "file"}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${label}`}
            disabled={disabled}
            onClick={() => onChange(null)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex h-14 w-full items-center rounded-lg border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted/40"
        >
          Choose {label.toLowerCase()}
        </button>
      )}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        title={`Choose ${label.toLowerCase()}`}
        accept={accept}
        max={max}
        value={value}
        onConfirm={(choices) => onChange(choices[0]?.url ?? null, choices[0])}
      />
    </div>
  );
}
