"use client";

import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "cn";

export function SideSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "w-full gap-0 overflow-hidden p-0 data-[side=left]:sm:max-w-xl data-[side=right]:sm:max-w-xl",
          "sm:rounded-2xl sm:border data-[side=left]:sm:inset-y-3 data-[side=left]:sm:left-3 data-[side=left]:sm:h-auto data-[side=right]:sm:inset-y-3 data-[side=right]:sm:right-3 data-[side=right]:sm:h-auto",
          className,
        )}
      >
        <SheetHeader className="border-b border-border/70 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <SheetFooter className="border-t border-border/70">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
