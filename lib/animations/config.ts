export const animationConfig = {
  duration: {
    instant: 0,
    fast: 0.25,
    normal: 0.45,
    slow: 0.7,
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
    linear: "linear" as const,
  },
  spring: {
    snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
    soft: { type: "spring" as const, stiffness: 220, damping: 28 },
  },
  stagger: {
    fast: 0.06,
    normal: 0.1,
    slow: 0.16,
  },
  distance: {
    sm: 12,
    md: 24,
    lg: 40,
  },
  viewport: {
    once: true,
    amount: 0.25,
    margin: "0px 0px -8% 0px",
  },
  scale: {
    from: 0.96,
  },
} as const

export type AnimationConfig = typeof animationConfig
