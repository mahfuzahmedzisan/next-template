"use client"

import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  indeterminate?: boolean
  theme?: "overlay" | "inline"
  className?: string
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  indeterminate = false,
  theme = "overlay",
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference
  const center = size / 2
  const isOverlay = theme === "overlay"

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={indeterminate ? "Uploading…" : `${Math.round(value)}% uploaded`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        className={cn(indeterminate && "animate-spin")}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={isOverlay ? undefined : "stroke-muted"}
          style={isOverlay ? { stroke: "rgba(255,255,255,0.22)" } : undefined}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.72 : offset}
          strokeLinecap="round"
          className={isOverlay ? undefined : "stroke-primary"}
          style={{
            transition: "stroke-dashoffset 0.4s cubic-bezier(0.4,0,0.2,1)",
            ...(isOverlay ? { stroke: "white" } : {}),
          }}
        />
      </svg>
      {!indeterminate && (
        <span
          className={cn(
            "absolute leading-none font-semibold tabular-nums select-none",
            isOverlay ? "text-white" : "text-primary"
          )}
          style={{ fontSize: Math.max(9, Math.round(size * 0.21)) }}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}
