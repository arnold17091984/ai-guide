// src/lib/motion.ts
export const EASE_APPLE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  medium: 0.5,
  slow: 0.6,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE_APPLE },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Terminal typing animation helpers
export const terminalLine = {
  hidden: { opacity: 0, x: -4 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.fast, ease: EASE_APPLE },
  },
};
