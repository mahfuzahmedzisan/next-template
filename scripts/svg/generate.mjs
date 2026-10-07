import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { XMLParser } from "fast-xml-parser"
import { optimize } from "svgo"
import svgoConfig from "./svgo.config.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const sourceDirectory = path.join(root, "assets/svg")
const outputDirectory = path.join(root, "components/svg/generated")
const checkOnly = process.argv.includes("--check")
const MAX_SOURCE_BYTES = 256 * 1024
const MAX_NODES = 4_000
const supportedTags = new Set([
  "svg", "g", "path", "line", "circle", "ellipse", "rect", "polygon",
  "polyline", "text", "tspan", "title", "desc", "defs", "linearGradient",
  "radialGradient", "stop", "mask", "clipPath", "filter", "feBlend",
  "feColorMatrix", "feComponentTransfer", "feComposite", "feDropShadow",
  "feFlood", "feGaussianBlur", "feMerge", "feMergeNode", "feOffset",
  "symbol", "use",
])

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: false,
  commentPropName: "#comment",
})

function camelAttribute(name) {
  if (name === "class") return "className"
  if (name === "xlink:href") return "xlinkHref"
  if (name.startsWith("data-") || name.startsWith("aria-")) return name
  return name.replace(/[:\-]([a-z])/g, (_, letter) => letter.toUpperCase())
}

function parseStyle(value) {
  return Object.fromEntries(
    value.split(";").flatMap((entry) => {
      const separator = entry.indexOf(":")
      if (separator < 0) return []
      const key = entry.slice(0, separator).trim()
      const styleValue = entry.slice(separator + 1).trim()
      return key && styleValue ? [[camelAttribute(key), styleValue]] : []
    }),
  )
}

function attributesOf(entry) {
  const raw = entry[":@"] ?? {}
  const attributes = {}
  for (const [name, value] of Object.entries(raw)) {
    const normalizedName = camelAttribute(name)
    attributes[normalizedName] = normalizedName === "style" ? parseStyle(String(value)) : String(value)
  }
  return attributes
}

function collectReferences(value, references) {
  if (typeof value !== "string") return
  for (const match of value.matchAll(/url\(\s*#([^\s)]+)\s*\)/g)) references.add(match[1])
  if (value.startsWith("#")) references.add(value.slice(1))
  for (const token of value.split(/\s+/)) {
    if (/^[A-Za-z_][\w:.-]*$/.test(token)) references.add(token)
  }
}

function parseChildren(entries, context, ancestry = []) {
  const nodes = []
  for (const entry of entries ?? []) {
    if ("#text" in entry) {
      const value = String(entry["#text"])
      if (value.trim()) nodes.push(value)
      continue
    }
    if ("#comment" in entry) continue
    const tag = Object.keys(entry).find((key) => key !== ":@")
    if (!tag) continue
    if (!supportedTags.has(tag)) throw new Error(`${context.file}: unsupported <${tag}> element`)
    context.nodeCount += 1
    if (context.nodeCount > MAX_NODES) throw new Error(`${context.file}: exceeds ${MAX_NODES} nodes`)

    const attrs = attributesOf(entry)
    for (const name of Object.keys(attrs)) {
      if (/^on/i.test(name)) throw new Error(`${context.file}: executable ${name} attribute is forbidden`)
    }

    const sourceId = typeof attrs.id === "string" ? attrs.id : undefined
    if (sourceId) {
      if (context.ids.has(sourceId)) throw new Error(`${context.file}: duplicate id ${sourceId}`)
      context.ids.add(sourceId)
      attrs["data-part"] = sourceId
      context.parts.push(sourceId)
    }

    const nodePath = [...ancestry, sourceId ?? `${tag}:${nodes.length}`]
    if (sourceId) {
      context.inventory.push({
        part: sourceId,
        sourceId,
        tag,
        path: nodePath.join("/"),
        ...(attrs["data-pivot"] ? { pivot: attrs["data-pivot"] } : {}),
      })
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (name === "href" || name === "xlinkHref" || name === "aria-labelledby" || name === "aria-describedby" || (typeof value === "string" && value.includes("url("))) {
        collectReferences(value, context.references)
      }
      if (typeof value === "string" && /(?:javascript:|data:text\/html|https?:|\/\/)/i.test(value)) {
        throw new Error(`${context.file}: external or executable reference in ${name}`)
      }
    }

    nodes.push({ tag, attrs, children: parseChildren(entry[tag], context, nodePath) })
  }
  return nodes
}

function variableName(file) {
  const stem = file.replace(/\.svg$/i, "").replace(/^\d+-/, "")
  return `${stem.replace(/[^a-zA-Z0-9]+(.)/g, (_, letter) => letter.toUpperCase()).replace(/^[^a-zA-Z_$]+/, "")}Asset`
}

function moduleSource(file, optimizedSvg) {
  const document = parser.parse(optimizedSvg)
  const rootEntry = document.find((entry) => entry.svg)
  if (!rootEntry) throw new Error(`${file}: missing root svg element`)
  const context = { file, ids: new Set(), parts: [], references: new Set(), inventory: [], nodeCount: 0 }
  const rootAttrs = attributesOf(rootEntry)
  const nodes = parseChildren(rootEntry.svg, context)
  for (const reference of context.references) {
    if (!context.ids.has(reference)) throw new Error(`${file}: broken internal reference #${reference}`)
  }
  const definitions = context.inventory.filter(({ tag }) => ["linearGradient", "radialGradient", "mask", "clipPath", "filter", "symbol"].includes(tag)).map(({ sourceId }) => sourceId)
  const name = variableName(file)
  const value = {
    name: file.replace(/\.svg$/i, ""),
    root: rootAttrs,
    nodes,
    inventory: {
      parts: context.inventory,
      definitions,
      references: [...context.references].sort(),
      sourceHash: createHash("sha256").update(optimizedSvg).digest("hex").slice(0, 16),
    },
  }
  return {
    name,
    source: `/* Generated by scripts/svg/generate.mjs. Do not edit. */\nimport type { SvgAssetDefinition } from "@/lib/svg/types"\n\nexport const ${name} = ${JSON.stringify(value, null, 2)} as const satisfies SvgAssetDefinition\n\nexport type ${name[0].toUpperCase()}${name.slice(1)}Part = typeof ${name}.inventory.parts[number]["part"]\n`,
  }
}

function validateRaw(file, source) {
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) throw new Error(`${file}: exceeds ${MAX_SOURCE_BYTES} bytes`)
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error(`${file}: doctypes and entities are forbidden`)
  if (/<(?:script|foreignObject|style)\b/i.test(source)) throw new Error(`${file}: scripts, foreignObject, and remaining style blocks are forbidden`)
  if (/\son[a-z]+\s*=/i.test(source)) throw new Error(`${file}: inline event attributes are forbidden`)
}

async function emit(target, content) {
  if (checkOnly) {
    let current = ""
    try { current = await readFile(target, "utf8") } catch {}
    if (current !== content) throw new Error(`${path.relative(root, target)} is stale; run pnpm svg:generate`)
    return
  }
  await writeFile(target, content)
}

async function main() {
  const files = (await readdir(sourceDirectory)).filter((file) => file.endsWith(".svg")).sort()
  if (!files.length) throw new Error("No SVG sources found in assets/svg")
  await mkdir(outputDirectory, { recursive: true })
  const exports = []
  for (const file of files) {
    const source = await readFile(path.join(sourceDirectory, file), "utf8")
    validateRaw(file, source)
    const result = optimize(source, { ...svgoConfig, path: path.join(sourceDirectory, file) })
    const generated = moduleSource(file, result.data)
    const outputName = file.replace(/\.svg$/i, ".ts")
    await emit(path.join(outputDirectory, outputName), generated.source)
    exports.push(`export { ${generated.name} } from "./${outputName.replace(/\.ts$/, "")}"`)
  }
  await emit(path.join(outputDirectory, "index.ts"), `/* Generated by scripts/svg/generate.mjs. Do not edit. */\n${exports.join("\n")}\n`)
  console.log(`${checkOnly ? "Checked" : "Generated"} ${files.length} SVG assets.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
