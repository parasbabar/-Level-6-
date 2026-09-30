import { motion, useReducedMotion, HTMLMotionProps } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { dur } from '../../lib/motion';
import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const reduced = useReducedMotion();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#050805] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-green text-[#020802] hover:shadow-[0_0_20px_rgba(124,255,58,0.35)] disabled:hover:shadow-none',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/[0.15] hover:border-white/30',
    ghost: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileTap={!reduced && !disabled ? { scale: 0.97 } : undefined}
      transition={{ duration: dur.micro }}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          className="inline-flex"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.span>
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
