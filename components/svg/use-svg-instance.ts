"use client"

import { useId, useMemo } from "react"

import type { SvgAssetDefinition, SvgPartRegistry } from "@/lib/svg/types"

export function useSvgInstance(_asset: SvgAssetDefinition, name = "svg") {
  const reactId = useId()
  return useMemo(() => {
    const elements = new Map<string, SVGElement>()
    const partsRef: SvgPartRegistry = {
      register(part, node) {
        if (node) elements.set(part, node)
        else elements.delete(part)
      },
      get(part) {
        return elements.get(part) ?? null
      },
      getMany(parts) {
        return parts.flatMap((part) => elements.get(part) ?? [])
      },
    }
    return { instanceId: `${name}-${reactId.replace(/:/g, "")}`, parts: partsRef, partsRef }
  }, [name, reactId])
}
