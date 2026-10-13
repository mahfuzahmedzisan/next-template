/** Demo copy for the services page and the home page summary. */
export type Service = {
  slug: string
  title: string
  short: string
  description: readonly string[]
  deliverables: readonly string[]
}

export const services: readonly Service[] = [
  {
    slug: "web-applications",
    title: "Web application development",
    short:
      "Dashboards, portals and internal tools built with Next.js and Laravel, designed around the way your team already works.",
    description: [
      "Most of the applications we build replace a spreadsheet, a shared inbox or a process that lives in someone's head. We start by watching how the work happens today, then design the smallest application that removes the most friction.",
      "The front end uses Next.js with server rendering for fast first loads, and the back end uses Laravel for authentication, queues, notifications and the business rules that need to stay in one trusted place.",
    ],
    deliverables: [
      "A working release every week on a private preview link",
      "Role-based access, audit history and secure sessions",
      "Automated tests for the parts that handle money or personal data",
    ],
  },
  {
    slug: "api-integrations",
    title: "APIs and integrations",
    short:
      "Clean, documented APIs and reliable integrations with payment, accounting, email and search providers.",
    description: [
      "Good integrations are boring: they retry failed calls, never charge a card twice and tell a person when something needs attention. We build them on queues with idempotent jobs and clear logs, so a slow provider never takes your application down with it.",
      "When other teams or mobile apps need your data, we design versioned APIs with consistent errors, pagination and documentation that new developers can follow without a meeting.",
    ],
    deliverables: [
      "Stripe, accounting, email, SMS and search integrations",
      "Queued background jobs with monitoring and alerts",
      "API documentation and a short onboarding guide",
    ],
  },
  {
    slug: "performance-seo",
    title: "Performance and technical SEO",
    short:
      "Faster pages, healthier Core Web Vitals and the technical SEO details that crawlers and social networks check.",
    description: [
      "Speed and search visibility usually fail for the same reasons: pages that render on every request, oversized images, scripts nobody needs and metadata that crawlers never see. We audit the site, fix the causes and add checks so the problems do not return.",
      "Typical work includes static and incremental rendering, image and font optimization, structured data, sitemaps, robots rules, canonical URLs, social images and redirects that preserve existing rankings.",
    ],
    deliverables: [
      "A prioritized audit with measured before and after results",
      "Static or incremental rendering for public pages",
      "Automated SEO and sitemap checks in your pipeline",
    ],
  },
  {
    slug: "maintenance",
    title: "Maintenance and support",
    short:
      "Upgrades, monitoring, fixes and small improvements for applications that need to keep running smoothly.",
    description: [
      "Software needs care after launch. We keep frameworks and dependencies current, watch error reports and queue health, and fix issues before they reach your customers. Small improvements are planned in short monthly cycles.",
      "If you inherited an application without documentation, we start with a written review of its architecture, risks and quick wins, so you know exactly what you have before any changes are made.",
    ],
    deliverables: [
      "Monthly upgrades and dependency security patches",
      "Error, uptime and queue monitoring with clear alerts",
      "A runbook covering deploys, backups and recovery",
    ],
  },
]

export const servicesFaq = {
  heading: "Questions about services",
  items: [
    {
      question: "How do you price a project?",
      answer: "Most projects are priced per weekly milestone after a short discovery phase, with an estimate given as a range and the assumptions written down. Audits have a fixed price, and maintenance plans are a fixed monthly fee with a set number of hours.",
    },
    {
      question: "Can you join an existing team?",
      answer: "Yes. We regularly work alongside in-house developers and designers, follow your code review process and tools, and pair with the team on the parts they want to own after the project ends.",
    },
    {
      question: "What happens if priorities change?",
      answer: "Weekly releases make change cheap. We review the plan every week, and new ideas replace lower-priority work in the next milestone instead of quietly growing the scope.",
    },
  ],
} as const

export const servicesPage = {
  title: "Services for teams that need dependable web software",
  intro:
    "We help small and medium teams plan, build and improve web applications. Every engagement starts with understanding the problem, continues with weekly working releases and ends with a system your team can run and extend without us.",
  approach: [
    {
      title: "Fixed-scope projects",
      body: "A clearly defined first release with an agreed outcome, a timeline in weeks and a price range based on written assumptions. Ideal for new products and replacements of existing tools.",
    },
    {
      title: "Ongoing partnership",
      body: "A set number of days each month for improvements, upgrades and support. Ideal for teams with a live product that needs steady progress without hiring a full-time developer.",
    },
    {
      title: "Audits and reviews",
      body: "A short, focused review of performance, SEO, security or code quality with a prioritized list of fixes. Ideal before a launch, a funding round or a big redesign.",
    },
  ],
} as const
