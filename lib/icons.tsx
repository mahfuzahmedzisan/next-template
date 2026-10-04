"use client"

import type { LucideProps } from "lucide-react"
import { createElement, useMemo } from "react"

import { CachedLucideIcon } from "@/components/icons/cached-lucide-icon"
import { resolveIconKey } from "@/lib/icon-keys"

export type { IconKey } from "@/lib/icon-keys"
export {
  getIconLabel,
  isIconKey,
  isValidLucideIconKey,
  resolveIconKey,
} from "@/lib/icon-keys"

export function Icon({
  icon,
  className,
  ...props
}: {
  icon?: string | null
  className?: string
} & Omit<LucideProps, "ref">) {
  const name = useMemo(() => resolveIconKey(icon), [icon])

  return (
    <CachedLucideIcon
      name={name}
      className={className}
      aria-hidden={props["aria-hidden"] ?? true}
      {...props}
    />
  )
}

/** @deprecated Use <Icon /> for lazy-loaded icons. */
export function getIcon(icon?: string | null) {
  const name = resolveIconKey(icon)

  return function IconComponent(props: LucideProps) {
    return createElement(Icon, { icon: name, ...props })
  }
}
