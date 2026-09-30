import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, staggerContainer, safeVariants } from '../../lib/motion';
import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  tags?: { label: string; variant?: 'default' | 'green' | 'amber' | 'violet' }[];
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, description, tags, actions, children }: PageShellProps) {
  const reduced = useReducedMotion();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Page header */}
      <motion.header
        variants={safeVariants(staggerContainer, reduced)}
        initial="hidden"
        animate="show"
        className="border-b border-white/10 pb-6 space-y-4"
      >
        {/* Tags */}
        {tags && tags.length > 0 && (
          <motion.div variants={safeVariants(fadeUp, reduced)} className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                  tag.variant === 'green'
                    ? 'bg-green/10 text-green border border-green/20'
                    : tag.variant === 'amber'
                    ? 'bg-amber/10 text-amber border border-amber/20'
                    : tag.variant === 'violet'
                    ? 'bg-violet/10 text-violet border border-violet/20'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </motion.div>
        )}

        {/* Title + actions */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <motion.div variants={safeVariants(fadeUp, reduced)} className="space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
            {description && (
              <p className="text-base text-white/55 max-w-3xl leading-relaxed">{description}</p>
            )}
          </motion.div>
          {actions && (
            <motion.div variants={safeVariants(fadeUp, reduced)} className="flex gap-3">
              {actions}
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Page content */}
      {children}
    </div>
  );
}
