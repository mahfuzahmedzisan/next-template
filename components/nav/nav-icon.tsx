import { cn } from "cn";
import type { NavIcon as NavIconType } from "@/lib/nav";

export function NavIcon({
  icon,
  className,
}: {
  icon: NavIconType;
  className?: string;
}) {
  if (typeof icon === "string") {
    if (icon.trimStart().startsWith("<svg")) {
      return (
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4",
            className,
          )}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    }

    return (
      // Config-authored asset (URL or public SVG), not user content.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className={cn("size-4 shrink-0 object-contain", className)}
      />
    );
  }

  const Icon = icon;
  return <Icon className={cn("size-4 shrink-0", className)} />;
}
