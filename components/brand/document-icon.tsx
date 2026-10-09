"use client";

import { useEffect } from "react";

/** Replace the tab icon after load. Chrome keeps a cached favicon.ico otherwise. */
export function DocumentIcon({ href }: { href: string | null }) {
  useEffect(() => {
    if (!href) return;

    const target = new URL(href, window.location.origin).href;

    function apply() {
      const links = [
        ...document.querySelectorAll<HTMLLinkElement>(
          "link[rel='icon'], link[rel='shortcut icon']",
        ),
      ];
      const primary = links[0];

      if (!primary) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.href = href!;
        document.head.appendChild(link);
        return;
      }

      if (primary.href !== target || primary.type !== "image/png") {
        primary.type = "image/png";
        primary.removeAttribute("sizes");
        primary.href = href!;
      }

      for (const extra of links.slice(1)) extra.remove();
    }

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [href]);

  return null;
}
