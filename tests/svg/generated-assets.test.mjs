import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "../..")

function generatedValue(source) {
  const start = source.indexOf("= ") + 2
  const end = source.lastIndexOf(" as const satisfies")
  return JSON.parse(source.slice(start, end))
}

function findPart(nodes, part) {
  for (const node of nodes) {
    if (node.attrs?.["data-part"] === part) return node
    const nested = findPart(node.children?.filter((child) => typeof child !== "string") ?? [], part)
    if (nested) return nested
  }
}

test("generated SVG modules are deterministic and current", () => {
  execFileSync(process.execPath, ["scripts/svg/generate.mjs", "--check"], { cwd: root, stdio: "pipe" })
})

test("robot preserves nested arm structure, pivots, and logical parts", async () => {
  const source = await readFile(path.join(root, "components/svg/generated/robot.ts"), "utf8")
  const robot = generatedValue(source)
  const arm = findPart(robot.nodes, "right-arm")
  const forearm = findPart(arm.children, "right-lower-arm")
  const hand = findPart(forearm.children, "right-hand-group")
  assert.equal(arm.attrs["data-pivot"], "206 176")
  assert.equal(forearm.attrs["data-pivot"], "223 213")
  assert.equal(hand.attrs["data-pivot"], "230 244")
  assert.equal(new Set(robot.inventory.parts.map(({ part }) => part)).size, robot.inventory.parts.length)
})

test("all authored assets avoid executable SVG features", async () => {
  const directory = path.join(root, "assets/svg")
  for (const file of await readdir(directory)) {
    const source = await readFile(path.join(directory, file), "utf8")
    assert.doesNotMatch(source, /<!DOCTYPE|<!ENTITY|<(?:script|foreignObject)\b|\son[a-z]+\s*=/i, file)
  }
})

test("transition panel inventory retains and resolves its paint servers", async () => {
  const source = await readFile(path.join(root, "components/svg/generated/20-transition-panel.ts"), "utf8")
  const panel = generatedValue(source)
  assert.deepEqual(panel.inventory.references, ["blue", "purple"])
  assert.ok(panel.inventory.definitions.includes("blue"))
  assert.ok(panel.inventory.definitions.includes("purple"))
})
