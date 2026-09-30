import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, safeVariants } from '../../lib/motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={safeVariants(fadeUp, reduced)}
      initial="hidden"
      animate="show"
      className="text-center py-16 px-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl"
    >
      {/* Floating icon */}
      <motion.div
        animate={!reduced ? { y: [0, -8, 0] } : {}}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-16 h-16 mb-6 text-white/20"
      >
        {icon}
      </motion.div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </motion.div>
  );
}
