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
import { fetchPageSeo } from "@/lib/seo/public";
import { siteStructuredData } from "@/lib/structured-data";
import { Analytics } from "@vercel/analytics/next"

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Site-wide parts only; each public page sets its own title, description, canonical and OG. */
export async function generateMetadata(): Promise<Metadata> {
  const { identity } = await fetchPageSeo("/");

  return {
    metadataBase: new URL(identity.site_url),
    title: {
      default: identity.name,
      template: `%s · ${identity.name}`,
    },
    applicationName: identity.name,
    creator: identity.name,
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, home] = await Promise.all([fetchPublicSettings(), fetchPageSeo("/")]);

  return (
    <html
      lang={home.identity.locale.replace("_", "-") || "en"}
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col">
        <DocumentIcon href={settings.favicon_url} />
        <JsonLd data={siteStructuredData(home.identity, home.description)} />
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
