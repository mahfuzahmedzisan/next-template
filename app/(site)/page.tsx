import { KeyRound, ShieldCheck, LayoutDashboard } from "lucide-react"
import { TransitionLink as Link } from "@/components/transitions/transition-link"
import { RouteReady } from "@/components/transitions/route-ready"

import { ContactForm } from "@/components/site/contact-form"
import { ContactLinks } from "@/components/site/contact-links"
import { ProjectList } from "@/components/site/project-list"
import { Reveal } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import { hasContact, site } from "@/content/site"

const features = [
  {
    title: "Signed-in workspace",
    body: "Dashboard, profile, and security live in one shell. The public site stays separate.",
    icon: LayoutDashboard,
  },
  {
    title: "Session stays here",
    body: "Sign-in goes through this app. Tokens are not left in the browser for page scripts to read.",
    icon: ShieldCheck,
  },
  {
    title: "Account security",
    body: "Update your password and turn on an authenticator without leaving the workspace.",
    icon: KeyRound,
  },
]

export default function Home() {
  const showAbout = site.about.length > 0 || site.skills.length > 0
  const showWork = site.projects.length > 0
  const showContact = hasContact()
  const lead = site.role ?? "Private workspace"
  const summary =
    site.summary ??
    "Sign in to manage your profile, password, and two-factor authentication."

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 py-16 md:py-24">
      <RouteReady />
      <Reveal>
        <section aria-labelledby="home-heading" className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">{lead}</p>
          <h1
            id="home-heading"
            className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
          >
            {site.name}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {summary}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="min-h-11">
              <Link href="/login">Sign in</Link>
            </Button>
            {showContact ? (
              <Button asChild variant="outline" className="min-h-11">
                <a href="#contact">Contact</a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/register">Create an account</Link>
              </Button>
            )}
            <ContactLinks />
          </div>
        </section>
      </Reveal>

      <section aria-label="Workspace" className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={0.08 + index * 0.06}>
            <article className="h-full rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md">
              <feature.icon className="size-4 text-foreground" />
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.body}
              </p>
            </article>
          </Reveal>
        ))}
      </section>

      {showAbout ? (
        <section id="about" className="scroll-mt-24 flex max-w-2xl flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            About
          </h2>
          {site.about.map((paragraph) => (
            <p
              key={paragraph}
              className="text-base leading-7 text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
          {site.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {site.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border/70 bg-card px-3 py-1 text-sm text-foreground"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {showWork ? (
        <section id="work" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Work
          </h2>
          <ProjectList />
        </section>
      ) : null}

      {showContact ? (
        <section id="contact" className="scroll-mt-24 flex max-w-xl flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Contact
          </h2>
          <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-md">
            <ContactLinks />
            {site.email ? <ContactForm email={site.email} /> : null}
          </div>
        </section>
      ) : null}
    </main>
  )
}
