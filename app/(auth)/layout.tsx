import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TransitionLink as Link } from "@/components/transitions/transition-link";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { getSession } from "@/lib/auth/auth-cookies";
import { site } from "@/content/site";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const notes = [
  {
    title: "Your session stays in this app",
    icon: ShieldCheck,
  },
  {
    title: "Password and two-factor live in the workspace",
    icon: KeyRound,
  },
];

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <div className="relative grid min-h-svh bg-muted/40 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      <aside className="hidden flex-col justify-between border-r border-border/70 bg-card/50 px-10 py-12 lg:flex">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {site.name}
          </Link>
          <p className="mt-8 max-w-sm text-3xl font-semibold tracking-tight">
            Sign in to your workspace.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Profile, password, and two-factor authentication are managed after
            you sign in.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {notes.map(({ title, icon: Icon }) => (
            <li key={title} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background">
                <Icon className="size-4" />
              </span>
              {title}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex text-sm font-semibold tracking-tight lg:hidden"
          >
            {site.name}
          </Link>
          <div className="**:data-[slot=card]:rounded-2xl **:data-[slot=card]:border-border/70 **:data-[slot=card]:bg-card/85 **:data-[slot=card]:shadow-sm **:data-[slot=card]:backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
