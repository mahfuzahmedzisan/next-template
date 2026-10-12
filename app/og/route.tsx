import { ImageResponse } from "next/og"

import { site } from "@/content/site"
import { fetchSiteIdentity } from "@/lib/seo/public"

/** Last-resort OG image; pages use their own or the global default image first. */
export async function GET() {
  const identity = await fetchSiteIdentity()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 600 }}>
          {identity.name}
        </div>
        {site.role ? (
          <div
            style={{
              display: "flex",
              fontSize: 36,
              marginTop: 24,
              color: "#a1a1aa",
            }}
          >
            {site.role}
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 628,
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    },
  )
}
