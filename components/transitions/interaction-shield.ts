const inertSnapshot = new Map<HTMLElement, boolean>()

function candidates(layer: HTMLElement) {
  const content = document.getElementById("content")
  const bodyChildren = [...document.body.children].filter((node): node is HTMLElement => node instanceof HTMLElement)
  return [content, ...bodyChildren.filter((node) => !node.contains(layer) && node.tagName !== "SCRIPT")].filter((node): node is HTMLElement => Boolean(node))
}

export function activateInteractionShield(layer: HTMLElement) {
  const protect = () => {
    for (const node of candidates(layer)) {
      if (!inertSnapshot.has(node)) inertSnapshot.set(node, node.inert)
      node.inert = true
    }
  }
  protect()
  const observer = new MutationObserver(protect)
  observer.observe(document.body, { childList: true })
  return () => {
    observer.disconnect()
    for (const [node, previous] of inertSnapshot) node.inert = previous
    inertSnapshot.clear()
  }
}
