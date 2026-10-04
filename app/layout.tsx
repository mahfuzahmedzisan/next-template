import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AlertCircleIcon, InfoIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"

import { AnimationProvider } from "@/components/animations/providers/animation-provider"
import { SectionErrorBoundary } from "@/components/site/section-error-boundary"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site, siteDescription } from "@/content/site"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: site.name,
  description: siteDescription(),
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnimationProvider>
            <TooltipProvider>
              <SiteHeader />
              <SectionErrorBoundary>{children}</SectionErrorBoundary>
              <SiteFooter />
              <Toaster
                position="top-center"
                duration={2000}
                icons={{
                  success: <CheckCircleIcon className="h-4 w-4" />,
                  error: <XCircleIcon className="h-4 w-4" />,
                  warning: <AlertCircleIcon className="h-4 w-4" />,
                  info: <InfoIcon className="h-4 w-4" />,
                }}
              />
            </TooltipProvider>
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
