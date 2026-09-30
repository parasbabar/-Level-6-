import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'green' | 'amber' | 'violet' | 'cyan' | 'rose';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', pulse = false, className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide uppercase border';

  const variantClasses = {
    default: 'bg-white/5 text-white/60 border-white/10',
    green: 'bg-green/10 text-green border-green/20',
    amber: 'bg-amber/10 text-amber border-amber/20',
    violet: 'bg-violet/10 text-violet border-violet/20',
    cyan: 'bg-cyan/10 text-cyan border-cyan/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'green' ? 'bg-green' : variant === 'amber' ? 'bg-amber' : 'bg-white'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'green' ? 'bg-green' : variant === 'amber' ? 'bg-amber' : 'bg-white'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
}
