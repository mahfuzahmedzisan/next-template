import type { Metadata } from "next"

import { LegalArticle } from "@/components/site/legal-article"
import { privacyPolicy } from "@/content/pages/legal"
import { toMetadata } from "@/lib/seo/metadata"
import { fetchPageSeo } from "@/lib/seo/public"

const PATH = "/privacy-policy"

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo(PATH))
}

export default async function PrivacyPolicyPage() {
  return <LegalArticle page={privacyPolicy} path={PATH} seo={await fetchPageSeo(PATH)} />
}
