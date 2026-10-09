import type { Metadata } from "next";
import { Geist } from "next/font/google";
import {
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { AnimationProvider } from "@/components/animations/providers/animation-provider";
import { DocumentIcon } from "@/components/brand/document-icon";
import { JsonLd } from "@/components/seo/json-ld";
import { SectionErrorBoundary } from "@/components/site/section-error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { TransitionProvider } from "@/components/transitions/transition-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchPublicSettings } from "@/lib/settings/public";
import { site, siteDescription } from "@/content/site";
import { siteOrigin } from "@/lib/site-url";
import { siteStructuredData } from "@/lib/structured-data";
import { Analytics } from "@vercel/analytics/next"

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const description = siteDescription();
const origin = siteOrigin();

export async function generateMetadata(): Promise<Metadata> {
  return {
  metadataBase: origin ? new URL(origin) : undefined,
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  ...(site.skills.length > 0 ? { keywords: [...site.skills] } : {}),
  alternates: origin ? { canonical: "/" } : undefined,
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: site.name,
    description,
    type: "website",
    locale: "en_US",
    siteName: site.name,
    ...(origin ? { url: "/" } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description,
  },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await fetchPublicSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col">
        <DocumentIcon href={settings.favicon_url} />
        <JsonLd data={siteStructuredData()} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnimationProvider>
            <TransitionProvider>
              <TooltipProvider>
                <div
                  id="content"
                  tabIndex={-1}
                  className="flex min-h-svh flex-1 flex-col outline-none"
                >
                  <SectionErrorBoundary>{children}</SectionErrorBoundary>
                </div>
                <Toaster
                  position="top-right"
                  duration={2000}
                  richColors
                  closeButton
                  icons={{
                    success: <CheckCircleIcon className="h-4 w-4" />,
                    error: <XCircleIcon className="h-4 w-4" />,
                    warning: <AlertCircleIcon className="h-4 w-4" />,
                    info: <InfoIcon className="h-4 w-4" />,
                  }}
                />
              </TooltipProvider>
            </TransitionProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
