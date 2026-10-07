import { createElement, type ReactNode } from "react"

import { resolveRootAttributes, resolveSvgAttributes } from "@/lib/svg/resolve-overrides"
import type { SvgAssetProps, SvgNode } from "@/lib/svg/types"

function safePrefix(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_")
}

function rewriteReference(value: unknown, prefix: string, sourceIds: ReadonlySet<string>) {
  if (typeof value !== "string") return value
  let rewritten = value.replace(/url\(\s*#([^\s)]+)\s*\)/g, (match, id) => sourceIds.has(id) ? `url(#${prefix}--${id})` : match)
  if (rewritten.startsWith("#") && sourceIds.has(rewritten.slice(1))) rewritten = `#${prefix}--${rewritten.slice(1)}`
  return rewritten.split(/\s+/).map((token) => sourceIds.has(token) ? `${prefix}--${token}` : token).join(" ")
}

export function SvgAsset<Part extends string = string>({
  asset,
  instanceId,
  root,
  defaults,
  byType,
  selectors,
  parts,
  partsRef,
  svgRef,
}: SvgAssetProps<Part>) {
  const prefix = safePrefix(instanceId)
  const sourceIds = new Set(asset.inventory.parts.map(({ sourceId }) => sourceId))

  function renderNode(node: SvgNode, index: number, ancestry: readonly string[]): ReactNode {
    const part = typeof node.attrs["data-part"] === "string" ? node.attrs["data-part"] : undefined
    const partPath = part ? [...ancestry, part] : ancestry
    const partOverride = part ? parts?.[part as Part] : undefined
    const attributes = resolveSvgAttributes({ node, partPath, defaults, byType, selectors, partOverride })
    if (typeof attributes.id === "string") attributes.id = `${prefix}--${attributes.id}`
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "href" || key === "xlinkHref" || key === "aria-labelledby" || key === "aria-describedby" || (typeof value === "string" && value.includes("url("))) {
        attributes[key] = rewriteReference(value, prefix, sourceIds)
      }
    }
    if (part && partsRef) {
      const suppliedRef = partOverride?.ref
      attributes.ref = (element: SVGElement | null) => {
        partsRef.register(part, element)
        if (typeof suppliedRef === "function") suppliedRef(element)
        else if (suppliedRef && "current" in suppliedRef) suppliedRef.current = element
      }
    }
    const children = node.children.map((child, childIndex) => typeof child === "string" ? child : renderNode(child, childIndex, partPath))
    return createElement(node.tag, { ...attributes, key: `${part ?? node.tag}-${index}` }, children)
  }

  const rootAttributes = resolveRootAttributes(asset.root, root as Readonly<Record<string, unknown>> | undefined)
  return createElement("svg", { ...rootAttributes, ref: svgRef, "data-svg-asset": asset.name, "data-svg-instance": prefix }, asset.nodes.map((node, index) => renderNode(node, index, [])))
}
