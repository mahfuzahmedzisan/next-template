import type { SvgElementOverride, SvgNode, SvgSelectorOverride, SvgTag } from "@/lib/svg/types"

type Attributes = Record<string, unknown>
const protectedPaint = /^(?:none|currentColor|url\()/i

function apply(base: Attributes, override: SvgElementOverride | undefined, exact = false, defaultsOnly = false) {
  if (!override) return base
  const next = { ...base }
  const { classNameMode, overrideNone, overridePaintServer, ...values } = override
  for (const [key, value] of Object.entries(values)) {
    if (key === "children" || key === "ref") continue
    if (defaultsOnly && next[key] != null) continue
    if ((key === "fill" || key === "stroke") && !exact && typeof next[key] === "string" && protectedPaint.test(next[key] as string)) continue
    if ((key === "fill" || key === "stroke") && exact && typeof next[key] === "string") {
      if (next[key] === "none" && !overrideNone) continue
      if (/^url\(/i.test(next[key] as string) && !overridePaintServer) continue
    }
    if (value === undefined) continue
    if (value === null) {
      delete next[key]
      continue
    }
    if (key === "className") {
      next.className = classNameMode === "replace" ? value : [next.className, value].filter(Boolean).join(" ")
      continue
    }
    if (key === "style") {
      const style = { ...((next.style as Attributes | undefined) ?? {}) }
      for (const [styleKey, styleValue] of Object.entries(value as Attributes)) {
        if (styleValue == null) delete style[styleKey]
        else style[styleKey] = styleValue
      }
      next.style = style
      continue
    }
    next[key] = value
  }
  return next
}

function selectorMatches(selector: string, node: SvgNode, partPath: readonly string[]) {
  const part = node.attrs["data-part"]
  if (selector === node.tag) return true
  if (selector.startsWith("#")) return part === selector.slice(1)
  const exact = selector.match(/^\[data-part=["'](.+)["']\]$/)
  if (exact) return part === exact[1]
  const prefix = selector.match(/^\[data-part\^=["'](.+)["']\]$/)
  if (prefix) return typeof part === "string" && part.startsWith(prefix[1])
  return selector.includes("/") && partPath.join("/") === selector
}

export function resolveSvgAttributes(options: {
  node: SvgNode
  partPath: readonly string[]
  defaults?: SvgElementOverride
  byType?: Partial<Record<SvgTag, SvgElementOverride>>
  selectors?: readonly SvgSelectorOverride[]
  partOverride?: SvgElementOverride
}) {
  let attributes: Attributes = { ...options.node.attrs }
  attributes = apply(attributes, options.defaults, false, true)
  attributes = apply(attributes, options.byType?.[options.node.tag])
  for (const candidate of options.selectors ?? []) {
    if (selectorMatches(candidate.selector, options.node, options.partPath)) attributes = apply(attributes, candidate.props)
  }
  return apply(attributes, options.partOverride, true)
}

export function resolveRootAttributes(source: Readonly<Record<string, unknown>>, root: Readonly<Record<string, unknown>> | undefined) {
  return apply({ ...source }, root as SvgElementOverride | undefined, true)
}
