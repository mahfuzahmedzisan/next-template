"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, delay, ease: easeOut }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
