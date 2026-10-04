import { siteNav } from "@/content/site"
import { cn } from "@/lib/utils"

const linkClass =
  "inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function NavLinks({
  className,
  listClassName,
}: {
  className?: string
  listClassName?: string
}) {
  const items = siteNav()

  if (items.length === 0) {
    return null
  }

  return (
    <ul className={cn("flex flex-wrap", listClassName, className)}>
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href} className={linkClass}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
