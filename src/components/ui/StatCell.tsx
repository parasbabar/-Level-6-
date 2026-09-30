import { motion } from 'framer-motion';
import { dur } from '../../lib/motion';
import { AnimatedNumber } from '../motion';
import type { ReactNode } from 'react';

interface StatCellProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number | string;
  icon?: ReactNode;
  variant?: 'default' | 'green' | 'amber' | 'violet' | 'cyan';
}

export function StatCell({ 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  description, 
  trend,
  trendValue,
  icon,
  variant = 'default'
}: StatCellProps) {
  const variantClasses = {
    default: 'text-white',
    green: 'text-green',
    amber: 'text-amber',
    violet: 'text-violet',
    cyan: 'text-cyan',
  };

  const bgClasses = {
    default: 'bg-white/5',
    green: 'bg-green/5',
    amber: 'bg-amber/5',
    violet: 'bg-violet/5',
    cyan: 'bg-cyan/5',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: dur.fast }}
      className={`p-5 rounded-xl border border-white/10 ${bgClasses[variant]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <p className="text-sm text-white/60">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-bold ${variantClasses[variant]}`}>
              {typeof value === 'number' ? (
                <AnimatedNumber 
                  value={value} 
                  prefix={prefix} 
                  suffix={suffix} 
                  decimals={0}
                  duration={1.4}
                />
              ) : (
                `${prefix}${value}${suffix}`
              )}
            </span>
            {trend && trendValue && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend === 'up' 
                  ? 'bg-green/10 text-green border border-green/20' 
                  : trend === 'down'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-white/10 text-white/60 border border-white/20'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${bgClasses[variant]} border border-white/10`}>
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-white/50 leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
