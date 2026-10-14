import type { Route } from "next"

import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { primaryNav, type NavItem } from "@/content/site"
import { cn } from "cn"

export function NavLinks({
  items = primaryNav,
  className,
  listClassName,
}: {
  items?: readonly NavItem[]
  className?: string
  listClassName?: string
}) {
  return (
    <ul className={cn("flex flex-wrap", listClassName, className)}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href as Route} className="site-nav">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
