"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CopyEmailButton({ email }: { email: string }) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(email)
      toast.success("Email copied")
    } catch {
      return
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11"
      onClick={onCopy}
    >
      Copy email
    </Button>
  )
}
