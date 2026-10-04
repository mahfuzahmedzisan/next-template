import { ImageResponse } from "next/og"

import { site } from "@/content/site"

export const alt = site.name

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
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
          {site.name}
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
    size,
  )
}
