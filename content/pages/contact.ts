/** Demo copy for the contact page. */
export const contactPage = {
  heading: "Contact Next Template about your next web project",
  lead: "Tell us a little about your team, the problem you want to solve and any deadline you are working towards. A few sentences are enough to start. A developer reads every message and replies within two working days.",
  next: {
    heading: "What happens next",
    steps: [
      {
        title: "A short reply",
        body: "Within two working days you get a personal reply with a few questions about your goals, your users and any existing systems.",
      },
      {
        title: "A free call",
        body: "If the project looks like a good fit, we schedule a thirty-minute call to talk through the problem, the constraints and possible first steps.",
      },
      {
        title: "A written proposal",
        body: "After the call you receive a short proposal with the scope of a first release, a timeline in weeks and an estimate based on written assumptions.",
      },
      {
        title: "A clear start",
        body: "Once you accept the proposal, we agree on a start date, set up a shared channel and a preview environment, and the first working build arrives at the end of week one.",
      },
    ],
  },
  prepare: {
    heading: "What to include in your message",
    intro:
      "You do not need a detailed brief. These few points help us give you a useful first answer instead of a list of questions:",
    items: [
      "Who the software is for and what they struggle with today.",
      "Any existing website, app or spreadsheet the project should replace or connect to.",
      "A rough budget range and any date that matters, such as a launch or a busy season.",
      "Who on your side will make decisions and give feedback during the project.",
    ],
  },
  details: {
    availability:
      "We answer messages on working days, between nine in the morning and six in the evening in your time zone wherever we can. Urgent issues for existing maintenance clients are handled the same day, including weekends, through the support channel agreed at the start of the plan.",
    heading: "Other ways to reach us",
    paragraph:
      "Prefer email? Write to us directly and include links to anything that helps explain the project, such as a current website, a spreadsheet or a few screenshots. We work remotely with clients in Europe, North America and Asia, and keep a few hours of overlap with every time zone we work with.",
  },
} as const
