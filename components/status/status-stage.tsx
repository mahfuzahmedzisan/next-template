"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function StatusStage({
  code,
  title,
  description,
  tone,
  children,
}: {
  code: string;
  title: string;
  description: string;
  tone: "missing" | "error";
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <main className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <StatusMark code={code} tone={tone} reduce={reduce === true} />
      <motion.h1
        className="mt-8 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        initial={reduce ? false : { transform: "translateY(8px)" }}
        animate={{ transform: "translateY(0px)" }}
        transition={{ duration: 0.45, ease, delay: 0.05 }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="mt-3 max-w-md text-base leading-7 text-muted-foreground"
        initial={reduce ? false : { transform: "translateY(8px)" }}
        animate={{ transform: "translateY(0px)" }}
        transition={{ duration: 0.45, ease, delay: 0.12 }}
      >
        {description}
      </motion.p>
      <motion.div
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
        initial={reduce ? false : { transform: "translateY(8px)" }}
        animate={{ transform: "translateY(0px)" }}
        transition={{ duration: 0.45, ease, delay: 0.18 }}
      >
        {children}
      </motion.div>
    </main>
  );
}

function StatusMark({
  code,
  tone,
  reduce,
}: {
  code: string;
  tone: "missing" | "error";
  reduce: boolean;
}) {
  const accent = tone === "missing" ? "var(--primary)" : "var(--destructive)";

  return (
    <div className="relative grid size-52 place-items-center" aria-hidden>
      <motion.div
        className="absolute inset-3 rounded-full border border-foreground/20"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={reduce ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full border border-dashed border-foreground/25"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        className="absolute top-2 size-2.5 rounded-full"
        style={{ background: accent }}
        animate={reduce ? undefined : { transform: ["translateY(0px)", "translateY(8px)", "translateY(0px)"] }}
        transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute right-4 bottom-8 size-2 rounded-full bg-foreground/30"
        animate={reduce ? undefined : { transform: ["translateY(0px)", "translateY(-6px)", "translateY(0px)"] }}
        transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative grid size-28 place-items-center rounded-[1.75rem] border bg-card shadow-sm"
        initial={reduce ? false : { transform: "scale(0.94)" }}
        animate={{ transform: "scale(1)" }}
        transition={{ type: "spring", bounce: 0.18, visualDuration: 0.45 }}
      >
        <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {code}
        </span>
      </motion.div>
    </div>
  );
}
