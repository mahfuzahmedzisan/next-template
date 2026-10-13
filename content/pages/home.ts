/** Demo copy for the home page. */
export const homePage = {
  eyebrow: "Web studio · Next.js and Laravel",
  heading: "Next Template builds fast, accessible web apps for growing teams",
  lead: "We design, build and look after web applications that replace spreadsheets, cut phone calls and give teams one reliable place to work. From the first sketch to production support, you work directly with the people writing the code.",
  intro: {
    heading: "Software that removes friction from everyday work",
    paragraphs: [
      "Most teams we work with do not need a giant platform. They need one tool that does a specific job very well: a dashboard everyone trusts, a booking flow customers can finish on a phone, or a portal that answers questions before they reach the support inbox.",
      "We combine product thinking with hands-on engineering. That means watching how the work really happens, agreeing on a small first release with a measurable goal, and shipping working software every week so you can see progress instead of reading status reports.",
      "Under the hood we use Next.js for fast, search-friendly front ends and Laravel for secure APIs, queues and business rules. The result is software that loads quickly, works with a keyboard and a screen reader, and keeps your data safe.",
    ],
  },
  process: {
    heading: "How a project runs",
    intro: "A simple, predictable process keeps projects small, honest and on track.",
    steps: [
      {
        title: "1. Discovery",
        body: "We spend a few sessions on the real workflow, the people involved and the numbers that should change. You get a one-page summary of the problem and the smallest useful release.",
      },
      {
        title: "2. Plan and estimate",
        body: "We break the first release into weekly milestones, list what is out of scope and give an estimate as a range with written assumptions, so changes are easy to discuss.",
      },
      {
        title: "3. Build in weekly releases",
        body: "Every week you get a working build on a private preview link and a short written update. Feedback goes straight into the next iteration instead of a long change request.",
      },
      {
        title: "4. Launch and support",
        body: "We launch with monitoring, backups and a runbook in place. We stay on for a support period, fix issues quickly and hand over documentation your team can rely on.",
      },
    ],
  },
  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        question: "What kind of projects do you take on?",
        answer: "Web applications, customer portals, internal tools, booking systems and public websites that need to be fast and search-friendly. We are a good fit when you want one small, experienced team that handles both the front end and the back end.",
      },
      {
        question: "How long does a typical project take?",
        answer: "A focused first release usually takes six to twelve weeks. Audits and reviews take one to two weeks. We always agree on the scope of the first release before giving a timeline, so the estimate is based on real requirements.",
      },
      {
        question: "Can you work with our existing code?",
        answer: "Yes. Many projects start with an existing Laravel or React code base. We begin with a short written review of the architecture, risks and quick wins, then improve the system step by step without a risky rewrite.",
      },
      {
        question: "Do you help after launch?",
        answer: "Every project includes a support period after launch. Many clients then move to a monthly maintenance plan that covers upgrades, monitoring, security patches and small improvements planned together each month.",
      },
      {
        question: "How do we get started?",
        answer: "Send a short message through the contact page describing the problem you want to solve. We reply within two working days with a few questions and, if it looks like a good fit, a time for a free thirty-minute call.",
      },
    ],
  },
  cta: {
    heading: "Have a project in mind?",
    body: "Tell us about the problem you want to solve. We reply within two working days with honest feedback on whether we can help and what a sensible first step would look like.",
  },
} as const
