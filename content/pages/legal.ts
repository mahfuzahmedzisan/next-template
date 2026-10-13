/**
 * Demo legal copy. It is a reasonable starting point, not legal advice;
 * have it reviewed before relying on it.
 */
export type LegalSection = {
  heading: string
  paragraphs: readonly string[]
  items?: readonly { title: string; body: string }[]
}

export type LegalPage = {
  heading: string
  updated: string
  intro: string
  sections: readonly LegalSection[]
}

export const privacyPolicy: LegalPage = {
  heading: "Privacy policy",
  updated: "2026-10-01",
  intro:
    "This policy explains what personal information this website collects, why it is collected, how long it is kept and the choices you have. It applies to the public website and to the private workspace available to signed-in users.",
  sections: [
    {
      heading: "Information we collect",
      paragraphs: [
        "We collect as little personal information as possible. Most visitors can read every public page without sharing anything about themselves.",
      ],
      items: [
        {
          title: "Messages you send",
          body: "When you write through the contact page or by email, we receive your name, email address and the content of your message. We use this only to reply and to discuss a possible project.",
        },
        {
          title: "Account information",
          body: "If you create an account, we store your name, email address, a securely hashed password, your preferences and, if you enable it, two-factor authentication settings.",
        },
        {
          title: "Technical data",
          body: "The servers record basic technical information such as IP address, browser type and the pages requested. These logs help keep the site secure and are deleted on a regular schedule.",
        },
      ],
    },
    {
      heading: "How information is used",
      paragraphs: [
        "Information is used to answer messages, provide and secure the private workspace, understand which pages are useful and keep the website working properly. We never sell personal information and we do not use it for advertising profiles.",
        "Privacy-friendly, aggregated analytics may be used to count page views. These statistics do not identify individual visitors.",
      ],
    },
    {
      heading: "Cookies",
      paragraphs: [
        "The website uses a small number of cookies that are necessary for it to work, such as a session cookie that keeps you signed in and a preference for light or dark mode. These cookies are not used to track you across other websites.",
      ],
    },
    {
      heading: "Sharing and storage",
      paragraphs: [
        "Personal information is stored with reputable hosting and email providers that process it on our behalf under appropriate agreements. Information is only shared with others when the law requires it.",
        "Contact messages are kept for up to two years after the last conversation. Account data is kept while your account is active and deleted within thirty days after you close it, except where the law requires a longer period.",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "All traffic to the website is encrypted, passwords are stored as one-way hashes, and access to production systems is limited and protected with two-factor authentication. No system is perfectly secure, but if a breach ever affects your information, you will be told promptly and given clear advice.",
      ],
    },
    {
      heading: "Children's privacy",
      paragraphs: [
        "The website is meant for businesses and adults. We do not knowingly collect personal information from children under sixteen. If you believe a child has shared information through the website, please get in touch and it will be deleted.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can ask for a copy of the personal information we hold about you, ask us to correct or delete it, or object to how it is used. Signed-in users can update most details directly in their account settings. To make a request, use the contact page and we will respond within thirty days.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "If this policy changes in a meaningful way, the date at the top of this page will be updated, and signed-in users will be told about significant changes in the workspace.",
      ],
    },
  ],
}

export const termsOfService: LegalPage = {
  heading: "Terms of service",
  updated: "2026-10-01",
  intro:
    "These terms describe the rules for using this website and the private workspace it offers. By using the website you agree to them. If you do not agree, please do not use the website.",
  sections: [
    {
      heading: "Using the website",
      paragraphs: [
        "You may read, share and link to the public pages of this website for personal and business purposes. Please do not copy large parts of the content, such as complete articles or case studies, without permission and a clear credit.",
      ],
      items: [
        {
          title: "Acceptable use",
          body: "Do not try to break, overload or gain unauthorized access to the website, its servers or other users' accounts, and do not use it to send spam or unlawful content.",
        },
        {
          title: "Automated access",
          body: "Search engines and well-behaved crawlers are welcome and should follow the rules in robots.txt. Aggressive scraping that affects performance is not allowed.",
        },
      ],
    },
    {
      heading: "Accounts",
      paragraphs: [
        "If you create an account, you are responsible for keeping your password safe and for activity that happens under your account. Enabling two-factor authentication is strongly recommended. Accounts that break these terms may be suspended or closed.",
      ],
    },
    {
      heading: "Content and intellectual property",
      paragraphs: [
        "Unless stated otherwise, the text, images, code samples and design of this website belong to Next Template. Client names and project details are shown with permission or have been changed to protect confidentiality.",
        "Code samples in blog posts may be used in your own projects without attribution, but they are provided as they are, without any warranty.",
      ],
    },
    {
      heading: "Project work",
      paragraphs: [
        "Information on this website about services, timelines and prices is a general guide and not an offer. Every project is covered by a separate written agreement that describes its scope, schedule, fees and ownership of the work.",
      ],
    },
    {
      heading: "Links to other websites",
      paragraphs: [
        "Some pages link to other websites, such as documentation, open-source projects or former clients. Those websites are run by other people, and we are not responsible for their content, availability or privacy practices. A link is not an endorsement of everything on the linked website.",
      ],
    },
    {
      heading: "Disclaimer and liability",
      paragraphs: [
        "The website is provided as it is. We work hard to keep it accurate and available, but we cannot promise that it will always be error-free or online. To the extent allowed by law, we are not liable for indirect losses arising from the use of the website.",
      ],
    },
    {
      heading: "Privacy",
      paragraphs: [
        "How personal information is collected, used and protected is described in the privacy policy, which forms part of these terms. By using the website you also accept the practices described there.",
      ],
    },
    {
      heading: "Suspension and termination",
      paragraphs: [
        "You can stop using the website and close your account at any time. Access may be suspended or ended without notice if an account is used to break these terms, to harm other users or to attack the website. Sections about content ownership, disclaimers and liability continue to apply afterwards.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of the country where Next Template is registered. If a dispute arises, we will first try to resolve it informally through a conversation. If any part of these terms is found to be unenforceable, the remaining parts stay in full effect.",
      ],
    },
    {
      heading: "Changes and contact",
      paragraphs: [
        "These terms may be updated from time to time, and the date at the top of the page will change when they are. If you have a question about the terms, please get in touch through the contact page.",
      ],
    },
  ],
}
