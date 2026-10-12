/** Demo copy for the about page. */
export const aboutPage = {
  heading: "About Mahfuz Ahmed, full-stack developer",
  lead: "I am a full-stack developer who helps small teams turn messy processes into simple, reliable web applications. I have spent the last decade building products with Next.js, React, Laravel and PHP for startups, agencies, clinics, retailers and education providers.",
  story: {
    heading: "My story",
    paragraphs: [
      "I started building websites for local businesses while studying computer science. The projects were small, but they taught me the most important lesson of my career: software is only useful when it fits the way people actually work. A beautiful dashboard that nobody opens is a failure; a plain form that saves someone an hour a day is a success.",
      "After university I joined a product agency, where I worked on everything from marketing sites to complex booking and payment systems. I learned how to scope projects honestly, how to talk to clients about trade-offs and how to keep a code base healthy after the launch party is over.",
      "Today I work independently with a small number of clients at a time. That lets me stay close to the problem, write the code myself and take responsibility for the result from the first sketch to production support.",
    ],
  },
  principles: {
    heading: "How I work",
    items: [
      {
        title: "Start with the real workflow",
        body: "Before writing code I watch how the work happens today. Private spreadsheets, sticky notes and repeated phone calls show where software can help most.",
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
        title: "Independent developer · 2021 to today",
        body: "Product development, technical SEO and maintenance for clients in finance, healthcare, logistics, retail and education, usually as the only developer or alongside a small in-house team.",
      },
      {
        title: "Senior developer, product agency · 2017 to 2021",
        body: "Led the development of booking platforms, e-commerce storefronts and internal tools, mentored junior developers and introduced automated testing and continuous deployment across projects.",
      },
      {
        title: "Web developer, freelance · 2014 to 2017",
        body: "Built websites and small applications for local businesses, learning to deliver complete projects, from hosting and email setup to content management and training.",
      },
    ],
  },
  outside: {
    heading: "Outside of work",
    paragraph:
      "When I am not at a keyboard I am usually reading about design and urban planning, cooking for friends, or walking somewhere new with a camera. I also write about what I learn on the blog, mostly practical notes on building, shipping and maintaining web applications.",
  },
} as const
