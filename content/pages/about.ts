/** Demo copy for the about page. */
export const aboutPage = {
  heading: "About Next Template, a Next.js and Laravel web studio",
  lead: "Next Template is a small web studio that helps teams turn messy processes into simple, reliable web applications. Our developers have spent the last decade building products with Next.js, React, Laravel and PHP for startups, agencies, clinics, retailers and education providers.",
  story: {
    heading: "Our story",
    paragraphs: [
      "The studio started with websites for local businesses. The projects were small, but they taught us the most important lesson we know: software is only useful when it fits the way people actually work. A beautiful dashboard that nobody opens is a failure; a plain form that saves someone an hour a day is a success.",
      "As the projects grew, so did the work: marketing sites first, then complex booking and payment systems. Along the way we learned how to scope projects honestly, how to talk to clients about trade-offs and how to keep a code base healthy after the launch party is over.",
      "Today we work with a small number of clients at a time. That lets us stay close to the problem, write the code ourselves and take responsibility for the result from the first sketch to production support.",
    ],
  },
  principles: {
    heading: "How we work",
    items: [
      {
        title: "Start with the real workflow",
        body: "Before writing code we watch how the work happens today. Private spreadsheets, sticky notes and repeated phone calls show where software can help most.",
      },
      {
        title: "Ship small, ship often",
        body: "Every week you get a working build on a preview link. Small releases make feedback concrete and keep surprises out of the launch week.",
      },
      {
        title: "Build for everyone",
        body: "Accessibility, performance and clear error messages are part of every feature, not extras added at the end. Good software works on a cheap phone and with a keyboard.",
      },
      {
        title: "Talk in plain language",
        body: "Updates explain what changed for your users, not which libraries were upgraded. Trade-offs, risks and costs are written down early, so decisions are made together and never discovered late.",
      },
      {
        title: "Measure what matters",
        body: "Every project agrees on a few numbers that should move, such as hours saved, calls avoided or pages that load faster, and checks them after launch instead of trusting a feeling.",
      },
      {
        title: "Leave things better documented",
        body: "Every project ends with documentation, a runbook and a handover session, so your team can run and extend the system with confidence.",
      },
    ],
  },
  experience: {
    heading: "Experience",
    items: [
      {
        title: "Product studio · 2021 to today",
        body: "Product development, technical SEO and maintenance for clients in finance, healthcare, logistics, retail and education, usually as the whole development team or alongside a small in-house team.",
      },
      {
        title: "Agency projects · 2017 to 2021",
        body: "Booking platforms, e-commerce storefronts and internal tools built with agency partners, along with mentoring for junior developers and automated testing and continuous deployment across projects.",
      },
      {
        title: "Small business websites · 2014 to 2017",
        body: "Websites and small applications for local businesses, delivered as complete projects, from hosting and email setup to content management and training.",
      },
    ],
  },
  outside: {
    heading: "Beyond client work",
    paragraph:
      "Outside client projects we read about design and accessibility, contribute fixes to the open-source tools we rely on, and share what we learn on the blog, mostly practical notes on building, shipping and maintaining web applications.",
  },
} as const
