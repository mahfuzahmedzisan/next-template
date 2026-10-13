import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AnimationProvider } from "@/components/animations/providers/animation-provider";
import { AppToaster } from "@/components/app-toaster";
import { JsonLd } from "@/components/seo/json-ld";
import { SectionErrorBoundary } from "@/components/site/section-error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { TransitionProvider } from "@/components/transitions/transition-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchBrandIcons } from "@/lib/brand/icons";
import { fetchPageSeo } from "@/lib/seo/public";
import { siteStructuredData } from "@/lib/structured-data";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Browser chrome follows the light and dark backgrounds in globals.css. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};

/** Site-wide parts only; each public page sets its own title, description, canonical and OG. */
export async function generateMetadata(): Promise<Metadata> {
  const [{ identity }, brand] = await Promise.all([fetchPageSeo("/"), fetchBrandIcons()]);
  const v = `?v=${brand.version}`;

  return {
    metadataBase: new URL(identity.site_url),
    title: {
      default: identity.name,
      template: `%s · ${identity.name}`,
    },
    applicationName: identity.name,
    creator: identity.name,
    formatDetection: { telephone: false, address: false, email: false },
    icons: {
      icon: [
        { url: `/favicon.ico${v}`, type: "image/x-icon" },
        { url: `/brand/icon-192.png${v}`, sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: `/brand/apple-touch-icon.png${v}`, sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const home = await fetchPageSeo("/");

  return (
    <html
      lang={home.identity.locale.replace("_", "-") || "en"}
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col">
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
                <div className="flex min-h-svh flex-1 flex-col">
                  <SectionErrorBoundary>{children}</SectionErrorBoundary>
                </div>
                <AppToaster />
              </TooltipProvider>
            </TransitionProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
