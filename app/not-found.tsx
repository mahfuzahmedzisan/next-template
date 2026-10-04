import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="text-base leading-7 text-muted-foreground">
        That page does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 w-fit items-center rounded-md text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Back to home
      </Link>
    </main>
  )
}
