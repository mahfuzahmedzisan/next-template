"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "cn";

/**
 * Folds rarely changed fields away. It starts open when one of them already
 * holds a custom value, and stays open while one of them has an error.
 */
export function SeoDisclosure({
  title,
  description,
  defaultOpen = false,
  forceOpen = false,
  className,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || forceOpen;

  return (
    <Collapsible open={expanded} onOpenChange={setOpen} className={cn("rounded-xl border border-border/70", className)}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left outline-none hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          {description ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-5 border-t border-border/70 p-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** A titled block of related fields inside a longer form. */
export function SeoFieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-5">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
