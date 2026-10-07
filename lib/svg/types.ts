import type { CSSProperties, ReactEventHandler, Ref, SVGProps } from "react"

export type SvgTag =
  | "g" | "path" | "line" | "circle" | "ellipse" | "rect" | "polygon"
  | "polyline" | "text" | "tspan" | "title" | "desc" | "defs"
  | "linearGradient" | "radialGradient" | "stop" | "mask" | "clipPath"
  | "filter" | "feBlend" | "feColorMatrix" | "feComponentTransfer"
  | "feComposite" | "feDropShadow" | "feFlood" | "feGaussianBlur"
  | "feMerge" | "feMergeNode" | "feOffset" | "symbol" | "use"

export interface SvgNode {
  readonly tag: SvgTag
  readonly attrs: Readonly<Record<string, string | Readonly<Record<string, string>>>>
  readonly children: readonly (SvgNode | string)[]
}

export interface SvgPartInventory {
  readonly part: string
  readonly sourceId: string
  readonly tag: SvgTag
  readonly path: string
  readonly pivot?: string
}

export interface SvgAssetDefinition {
  readonly name: string
  readonly root: Readonly<Record<string, string | Readonly<Record<string, string>>>>
  readonly nodes: readonly SvgNode[]
  readonly inventory: {
    readonly parts: readonly SvgPartInventory[]
    readonly definitions: readonly string[]
    readonly references: readonly string[]
    readonly sourceHash: string
  }
}

export type SvgStyle = CSSProperties & Record<`--${string}`, string | number | null | undefined>

export type SvgElementOverride = {
  [Key in keyof Omit<SVGProps<SVGElement>, "ref" | "style">]?: SVGProps<SVGElement>[Key] | null
} & {
  ref?: Ref<SVGElement>
  style?: SvgStyle | null
  classNameMode?: "merge" | "replace"
  overrideNone?: boolean
  overridePaintServer?: boolean
  onClick?: ReactEventHandler<SVGElement>
  [attribute: string]: unknown
}

export interface SvgSelectorOverride {
  selector: string
  props: SvgElementOverride
}

export interface SvgPartRegistry {
  register(part: string, node: SVGElement | null): void
  get(part: string): SVGElement | null
  getMany(parts: readonly string[]): SVGElement[]
}

export interface SvgAssetProps<Part extends string = string> {
  asset: SvgAssetDefinition
  instanceId: string
  root?: SvgElementOverride
  defaults?: SvgElementOverride
  byType?: Partial<Record<SvgTag, SvgElementOverride>>
  selectors?: readonly SvgSelectorOverride[]
  parts?: Partial<Record<Part, SvgElementOverride>>
  partsRef?: SvgPartRegistry
  svgRef?: Ref<SVGSVGElement>
}
