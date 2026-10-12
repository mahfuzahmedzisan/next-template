import type { Metadata } from "next";
import type { ReactNode } from "react";

import { toMetadata } from "@/lib/seo/metadata";
import { fetchPageSeo } from "@/lib/seo/public";

export async function generateMetadata(): Promise<Metadata> {
  return toMetadata(await fetchPageSeo("/register"));
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}