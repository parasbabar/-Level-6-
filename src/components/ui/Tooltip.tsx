import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { dur } from '../../lib/motion';
import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: dur.fast }}
            className={`absolute ${positions[side]} z-50 px-3 py-1.5 text-xs font-medium text-white bg-[#121814] border border-white/10 rounded-lg shadow-xl whitespace-nowrap pointer-events-none`}
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-[#121814] border-white/10 rotate-45 ${
                side === 'top'
                  ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r'
                  : side === 'bottom'
                  ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l'
                  : side === 'left'
                  ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r'
                  : 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
