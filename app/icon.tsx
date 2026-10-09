import { ImageResponse } from "next/og";

import { fetchPublicSettings } from "@/lib/settings/public";
import { siteOrigin } from "@/lib/site-url";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

function letterIcon(letter: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          color: "#fafafa",
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        {letter}
      </div>
    ),
    { ...size },
  );
}

export default async function Icon() {
  const settings = await fetchPublicSettings();
  const letter = (settings.short_name || settings.name || "M").slice(0, 1).toUpperCase();

  if (!settings.favicon_url) return letterIcon(letter);

  const src = new URL(settings.favicon_url, siteOrigin() ?? "http://localhost:3000").toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        <img alt="" src={src} width={32} height={32} />
      </div>
    ),
    { ...size },
  );
}
