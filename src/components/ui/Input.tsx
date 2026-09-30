import { motion, HTMLMotionProps } from 'framer-motion';
import { dur, slideDown, shakeX } from '../../lib/motion';
import type { ReactNode } from 'react';

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  containerClassName?: string;
  children?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  icon,
  className = '',
  containerClassName = '',
  ...props
}: InputProps) {
  return (
    <motion.div
      variants={shakeX}
      animate={error ? 'shake' : undefined}
      className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}
    >
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-white/40 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <motion.input
          whileFocus={{
            boxShadow: '0 0 0 2px rgba(74,222,40,0.2)',
            borderColor: 'rgba(74,222,40,0.5)',
          }}
          transition={{ duration: dur.fast }}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 rounded-xl bg-white/[0.04] border ${
            error
              ? 'border-rose-500/50 focus:border-rose-500/80 bg-rose-500/[0.03]'
              : 'border-white/10 hover:border-white/20 focus:border-green/50'
          } text-white placeholder:text-white/35 text-sm focus:outline-none transition-all ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <motion.p
          variants={slideDown}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium"
        >
          {error}
        </motion.p>
      ) : helperText ? (
        <p className="mt-1.5 text-[11px] text-white/40 leading-normal">{helperText}</p>
      ) : null}
    </motion.div>
  );
}

