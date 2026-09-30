/**
 * src/lib/motion.ts
 * Shared animation tokens, variants, and helpers for PrivEstate.
 * Import from here so every page uses identical timing.
 */

import type { Variants, Transition } from 'framer-motion';

/* ── Easing ──────────────────────────────────────────────────────────────── */
export const ease = [0.22, 1, 0.36, 1] as const;

/* ── Duration tokens ────────────────────────────────────────────────────── */
export const dur = {
  micro:   0.18,   // button press, tooltip
  fast:    0.28,   // chip active, badge
  normal:  0.45,   // card, modal
  section: 0.60,   // page entrance, drawer
} as const;

/* ── Spring tokens ───────────────────────────────────────────────────────── */
export const spring = {
  snappy:  { type: 'spring', stiffness: 380, damping: 26 } as Transition,
  gentle:  { type: 'spring', stiffness: 220, damping: 24 } as Transition,
  slow:    { type: 'spring', stiffness: 140, damping: 22 } as Transition,
  pill:    { type: 'spring', stiffness: 500, damping: 36 } as Transition,
  drawer:  { type: 'spring', stiffness: 300, damping: 30 } as Transition,
} as const;

/* ── Variants ────────────────────────────────────────────────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: dur.section, ease } },
  exit:   { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: dur.fast, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: dur.normal, ease } },
  exit:   { opacity: 0, transition: { duration: dur.fast } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: dur.normal, ease } },
  exit:   { opacity: 0, scale: 0.94, transition: { duration: dur.fast } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: spring.snappy },
  exit:   { opacity: 0, scale: 0.96, y: 8,  transition: { duration: dur.fast, ease } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  show:   { opacity: 1, x: 0,  transition: spring.gentle },
  exit:   { opacity: 0, x: 48, transition: { duration: dur.fast, ease } },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8, scaleY: 0.96 },
  show:   { opacity: 1, y: 0,  scaleY: 1, transition: { duration: dur.fast, ease } },
  exit:   { opacity: 0, y: -8, scaleY: 0.96, transition: { duration: dur.micro } },
};

export const shakeX: Variants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45, ease: 'easeInOut' },
  },
};

/* ── Stagger containers ──────────────────────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerFast: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
};

export const staggerSlow: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/* ── Page-level transition (used in PageTransition wrapper) ──────────────── */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0,  transition: { duration: dur.section, ease } },
  exit:    { opacity: 0, y: -8, transition: { duration: dur.fast,    ease } },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
/** Returns reduced-motion-safe variants — keeps opacity, removes transforms */
export function safeVariants(v: Variants, reduced: boolean | null): Variants {
  if (!reduced) return v;
  const safe: Variants = {};
  for (const key of Object.keys(v)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frame: any = { ...(v[key] as object) };
    delete frame.y; delete frame.x; delete frame.scale;
    delete frame.scaleY; delete frame.filter;
    safe[key] = frame;
  }
  return safe;
}
