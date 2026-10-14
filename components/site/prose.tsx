import { cn } from "cn"

type Block =
  | { kind: "h2" | "h3" | "p"; text: string }
  | { kind: "ul"; items: string[] }

/** The API's body format: "## " and "### " headings, "- " list items, blank-line paragraphs. */
function parse(body: string): Block[] {
  const blocks: Block[] = []

  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) continue

    if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ kind: "ul", items: lines.map((line) => line.slice(2)) })
    } else if (lines[0].startsWith("### ")) {
      blocks.push({ kind: "h3", text: lines[0].slice(4) })
      if (lines.length > 1) blocks.push({ kind: "p", text: lines.slice(1).join(" ") })
    } else if (lines[0].startsWith("## ")) {
      blocks.push({ kind: "h2", text: lines[0].slice(3) })
      if (lines.length > 1) blocks.push({ kind: "p", text: lines.slice(1).join(" ") })
    } else {
      blocks.push({ kind: "p", text: lines.join(" ") })
    }
  }

  return blocks
}

/** Long-form body text. Styling comes from descendant selectors so each element carries no classes. */
export function Prose({ body, className }: { body: string; className?: string }) {
  return (
    <div className={cn("site-copy site-prose", className)}>
      {parse(body).map((block, index) => {
        switch (block.kind) {
          case "h2":
            return <h2 key={index}>{block.text}</h2>
          case "h3":
            return <h3 key={index}>{block.text}</h3>
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          default:
            return <p key={index}>{block.text}</p>
        }
      })}
    </div>
  )
}
