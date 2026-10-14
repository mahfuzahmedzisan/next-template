"use client"

import { CheckCircle2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "cn"

interface AggregateProgressRowProps {
  value: number
  indeterminate?: boolean
  onCancel?: () => void
  className?: string
}

export function AggregateProgressRow({
  value,
  indeterminate = false,
  onCancel,
  className,
}: AggregateProgressRowProps) {
  const capped = Math.min(100, Math.max(0, value))
  const label = indeterminate
    ? "Uploading…"
    : capped >= 100
      ? "Upload complete — processing…"
      : `Uploading ${Math.round(capped)}%`

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span>{label}</span>
          {!indeterminate ? <span>{Math.round(capped)}%</span> : null}
        </div>
        <Progress value={indeterminate ? undefined : capped} />
      </div>
      {!indeterminate && capped >= 100 && <CheckCircle2 className="size-4 shrink-0 text-green-500" />}
      {onCancel && capped < 100 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
          Cancel
        </Button>
      )}
    </div>
  )
}
