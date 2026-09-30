import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { dur, spring, fadeIn, slideRight, safeVariants } from '../../lib/motion';
import type { ReactNode } from 'react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  width?: string | number;
  className?: string;
  children: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  side = 'right',
  title,
  subtitle,
  footer,
  width = 480,
  className = '',
  children,
}: DrawerProps) {
  const reduced = useReducedMotion();
  const drawerV = safeVariants(slideRight, reduced);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: dur.fast }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#050805]/80 backdrop-blur-md"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            variants={drawerV}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={spring.drawer}
            style={{ maxWidth: width }}
            className={`fixed ${
              side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
            } top-0 bottom-0 z-50 w-full bg-[#0B0F0C] border-white/10 shadow-2xl flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0B0F0C] shrink-0">
              <div className="min-w-0 pr-3">
                {typeof title === 'string' ? (
                  <h3 className="text-base font-bold text-white tracking-tight truncate">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-xs text-white/50 mt-0.5 leading-normal">{subtitle}</div>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">{children}</div>

            {/* Sticky Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-white/10 bg-[#0B0F0C]/90 backdrop-blur-sm shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

