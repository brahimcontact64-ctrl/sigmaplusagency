import type { Transition, Variants } from "motion/react";

/**
 * SIGMA+ motion system.
 * One set of durations/easings, reused everywhere, so animation feels
 * like one coherent language instead of ad-hoc per-component tuning.
 * All transitions here are safe to combine with the `reduceMotion="user"`
 * MotionConfig set globally — Motion then collapses them to instant
 * changes for anyone with prefers-reduced-motion, no per-component work.
 */

export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1];

export const DURATION = {
  fast: 0.2,
  base: 0.5,
  slow: 0.8,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const viewportOnce = { once: true, margin: "-80px" } as const;
