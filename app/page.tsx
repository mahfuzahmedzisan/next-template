import { ContactLinks } from "@/components/site/contact-links"
import { ProjectList } from "@/components/site/project-list"
import { hasContact, site } from "@/content/site"

export default function Home() {
  const showAbout = site.about.length > 0 || site.skills.length > 0
  const showWork = site.projects.length > 0
  const showContact = hasContact()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-6 py-16">
      <section aria-labelledby="home-heading" className="flex flex-col gap-4">
        <h1
          id="home-heading"
          className="text-3xl font-semibold tracking-tight text-foreground"
        >
          {site.name}
        </h1>
        {site.role ? (
          <p className="text-lg text-muted-foreground">{site.role}</p>
        ) : null}
        {site.summary ? (
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {site.summary}
          </p>
        ) : null}
        <ContactLinks />
      </section>

      {showAbout ? (
        <section id="about" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            About
          </h2>
          {site.about.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-xl text-base leading-7 text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
          {site.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {site.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-md bg-muted px-2 py-1 text-sm text-foreground"
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
        <section id="contact" className="scroll-mt-24 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Contact
          </h2>
          <ContactLinks />
        </section>
      ) : null}
    </main>
  )
}
