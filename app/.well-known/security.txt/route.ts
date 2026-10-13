import { siteOrigin } from "@/lib/site-url"

// RFC 9116 wants Expires under a year ahead; daily regeneration keeps it close to 180 days.
export const revalidate = 86400

const EXPIRES_IN_DAYS = 180

function contact(): string | null {
  const value = process.env.SECURITY_CONTACT?.trim()

  if (!value) return null
  if (/^(mailto:|https:\/\/)/i.test(value)) return value
  if (/^[^\s@]+@[^\s@]+$/.test(value)) return `mailto:${value}`

  return null
}

export function GET() {
  const address = contact()

  if (!address) {
    return new Response("Not found", { status: 404 })
  }

  const expires = new Date(Date.now() + EXPIRES_IN_DAYS * 86_400_000)
  expires.setUTCHours(0, 0, 0, 0)

  const origin = siteOrigin()
  const lines = [
    `Contact: ${address}`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    ...(origin ? [`Canonical: ${origin}/.well-known/security.txt`] : []),
  ]

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
