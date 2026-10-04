"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function titleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1);
  if (!last || last === "admin") return "Overview";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="font-heading text-sm font-medium">
        {titleFromPathname(pathname)}
      </h1>
    </header>
  );
}
