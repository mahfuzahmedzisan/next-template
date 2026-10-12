import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { fetchBrandBytes, fetchBrandIcons, type BrandIcons, type FaviconSetKey } from "@/lib/brand/icons";

const FILES = {
  "favicon.ico": { key: "favicon_ico", size: 48, type: "image/x-icon" },
  "icon-192.png": { key: "icon_192", size: 192, type: "image/png" },
  "icon-512.png": { key: "icon_512", size: 512, type: "image/png" },
  "apple-touch-icon.png": { key: "apple_touch_icon", size: 180, type: "image/png" },
} as const satisfies Record<string, { key: FaviconSetKey; size: number; type: string }>;

type BrandFile = keyof typeof FILES;

const ICO_SIZES = [16, 32, 48];

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(FILES).map((file) => ({ file }));
}

/**
 * favicon.ico and the app icons. Files the API generated from a raster
 * favicon are passed through; otherwise (SVG upload, or none) they are
 * rendered here from the SVG or the site's first letter.
 */
export async function GET(_request: Request, context: RouteContext<"/brand/[file]">) {
  const { file } = await context.params;
  if (!(file in FILES)) return new Response("Not found", { status: 404 });

  const spec = FILES[file as BrandFile];
  const brand = await fetchBrandIcons();
  const generated = brand.set?.[spec.key];
  const passthrough = generated ? await fetchBrandBytes(generated) : null;

  const body =
    passthrough ??
    (spec.type === "image/x-icon"
      ? packIco(await Promise.all(ICO_SIZES.map(async (size) => ({ size, png: await renderIcon(brand, size) }))))
      : await renderIcon(brand, spec.size));

  return new Response(Buffer.from(body), {
    headers: {
      "Content-Type": spec.type,      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

async function renderIcon(brand: BrandIcons, size: number): Promise<Uint8Array> {
  const source = await svgDataUri(brand.faviconUrl);

  if (source) {
    try {
      return await toPng(
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={source} width={size} height={size} style={{ objectFit: "contain" }} />
        </div>,
        size,
      );
    } catch {
      // fall through to the letter icon
    }
  }

  const letter = (brand.shortName || brand.name || "M").slice(0, 1).toUpperCase();

  return toPng(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111111",
        color: "#fafafa",
        fontSize: Math.round(size * 0.62),
        fontWeight: 600,
      }}
    >
      {letter}
    </div>,
    size,
  );
}

async function toPng(element: ReactElement, size: number): Promise<Uint8Array> {
  return new Uint8Array(await new ImageResponse(element, { width: size, height: size }).arrayBuffer());
}

/** Only SVG favicons reach this path; raster ones were converted by the API. */
async function svgDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  const bytes = await fetchBrandBytes(url);
  if (!bytes) return null;

  const head = new TextDecoder().decode(bytes.slice(0, 512)).trimStart().toLowerCase();
  const isSvg = head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"));
  return isSvg ? `data:image/svg+xml;base64,${Buffer.from(bytes).toString("base64")}` : null;
}

/** PNG-in-ICO, the format every current browser and crawler reads. */
function packIco(entries: { size: number; png: Uint8Array }[]): Uint8Array {
  const headerLength = 6 + 16 * entries.length;
  const out = new Uint8Array(headerLength + entries.reduce((sum, entry) => sum + entry.png.byteLength, 0));
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  let offset = headerLength;
  entries.forEach(({ size, png }, index) => {
    const at = 6 + 16 * index;
    out[at] = size >= 256 ? 0 : size;
    out[at + 1] = size >= 256 ? 0 : size;
    view.setUint16(at + 4, 1, true);
    view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, png.byteLength, true);
    view.setUint32(at + 12, offset, true);
    out.set(png, offset);
    offset += png.byteLength;
  });

  return out;
}
