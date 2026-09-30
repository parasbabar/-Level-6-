import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        !reduced && hover
          ? {
              y: -6,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,255,58,0.2)',
              borderColor: 'rgba(124,255,58,0.4)',
            }
          : undefined
      }
      transition={{ duration: dur.normal, ease }}
      className={`rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
