import type { Metadata } from "next"

import { LegalArticle } from "@/components/site/legal-article"
import { termsOfService } from "@/content/pages/legal"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/terms"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function TermsPage() {
  return <LegalArticle page={termsOfService} path={PATH} seo={await fetchPageSeo(PATH)} />
}
