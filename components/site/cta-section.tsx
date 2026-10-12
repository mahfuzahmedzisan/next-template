import { TransitionLink as Link } from "@/components/transitions/transition-link"

export function CtaSection({
  heading = "Have a project in mind?",
  body = "Tell me about the problem you want to solve. I reply within two working days with honest feedback and a sensible first step.",
}: {
  heading?: string
  body?: string
}) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="site-card flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between"
    >
      <div className="max-w-xl">
        <h2 id="cta-heading" className="site-h2s">
          {heading}
        </h2>
        <p className="site-small mt-2 text-base leading-7">{body}</p>
      </div>
      <Link href="/contact" className="site-btn">
        Start a conversation
      </Link>
    </section>
  )
}
