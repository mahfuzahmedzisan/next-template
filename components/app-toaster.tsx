"use client"

import { AlertCircleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from "lucide-react"

import { Toaster } from "@/components/ui/sonner"

/** Icons are created on the client so their SVG markup stays out of every page's RSC payload. */
export function AppToaster() {
  return (
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
  )
}
