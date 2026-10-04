"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ProjectCaseStudy({
  title,
  caseStudy,
}: {
  title: string
  caseStudy: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          Read more about {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base leading-7 whitespace-pre-wrap text-foreground">
            {caseStudy}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
