export function siteOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL

  if (!value) {
    return undefined
  }

  try {
    const url = new URL(value)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined
    }

    return url.origin
  } catch {
    return undefined
  }
}
