/**
 * PrivEstate Shared UI Primitives
 * ─────────────────────────────────────────────────────────────────────────────
 * All components use inline styles keyed to CSS variables from index.css.
 * No Tailwind utilities here — just semantic primitives so every page
 * looks identical regardless of which component renders it.
 */
import React from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Info, AlertTriangle, Shield } from 'lucide-react';

// ─── Color tokens (mirrored from CSS vars, used for inline styles) ────────────

export const C = {
  // Surfaces
  bg:           '#050805',
  surface:      'rgba(255,255,255,0.03)',
  surfaceRaised:'rgba(255,255,255,0.055)',
  surfaceBorder:'rgba(255,255,255,0.08)',
  surfaceBorderMd:'rgba(255,255,255,0.12)',

  // Semantic text
  textPrimary:  '#FFFFFF',
  textSecondary:'#9CA3AF',
  textMuted:    '#6B7280',
  textDim:      '#4B5563',

  // Primary — neon green (brand, primary CTAs, active nav, success)
  green:        '#7CFF3A',
  greenDim:     'rgba(124,255,58,0.12)',
  greenBorder:  'rgba(124,255,58,0.25)',
  greenGlow:    '0 0 18px rgba(124,255,58,0.30)',

  // Violet/indigo — ZK proofs, cryptographic, verification
  violet:       '#A78BFA',
  violetDim:    'rgba(167,139,250,0.10)',
  violetBorder: 'rgba(167,139,250,0.22)',

  // Cyan/teal — shielded, private data
  cyan:         '#22D3EE',
  cyanDim:      'rgba(34,211,238,0.10)',
  cyanBorder:   'rgba(34,211,238,0.22)',

  // Amber — pending, warnings, compliance review
  amber:        '#FCD34D',
  amberDim:     'rgba(252,211,77,0.10)',
  amberBorder:  'rgba(252,211,77,0.22)',

  // Rose/red — errors, danger
  rose:         '#FB7185',
  roseDim:      'rgba(251,113,133,0.10)',
  roseBorder:   'rgba(251,113,133,0.22)',

  // Blue — info
  blue:         '#60A5FA',
  blueDim:      'rgba(96,165,250,0.10)',
  blueBorder:   'rgba(96,165,250,0.22)',
};

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  padding?: string;
  accent?: 'green' | 'violet' | 'cyan' | 'amber' | 'rose' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children, className = '', style, onClick, hover = false, padding = '1.5rem', accent = 'none',
}) => {
  const [hovered, setHovered] = React.useState(false);
  const accentBorder = accent !== 'none' ? {
    green:  C.greenBorder,
    violet: C.violetBorder,
    cyan:   C.cyanBorder,
    amber:  C.amberBorder,
    rose:   C.roseBorder,
  }[accent] : undefined;

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hovered && hover ? C.greenBorder : (accentBorder || C.surfaceBorder)}`,
        borderRadius: '1.25rem',
        padding,
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        transform: hovered && hover ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && hover ? C.greenGlow : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'violet' | 'cyan' | 'amber';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary: { bg: 'linear-gradient(180deg,#7CFF3A 0%,#5FD318 40%,#2E7D0B 100%)', color:'#0a1a02', border:'rgba(124,255,58,0.3)', hoverBg:'' },
  ghost:   { bg: 'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.8)', border:'rgba(255,255,255,0.12)', hoverBg:'rgba(255,255,255,0.09)' },
  danger:  { bg: 'rgba(251,113,133,0.12)', color:'#FB7185', border:'rgba(251,113,133,0.3)', hoverBg:'rgba(251,113,133,0.18)' },
  violet:  { bg: 'rgba(167,139,250,0.12)', color:'#A78BFA', border:'rgba(167,139,250,0.3)', hoverBg:'rgba(167,139,250,0.18)' },
  cyan:    { bg: 'rgba(34,211,238,0.10)',  color:'#22D3EE', border:'rgba(34,211,238,0.3)',  hoverBg:'rgba(34,211,238,0.16)' },
  amber:   { bg: 'rgba(252,211,77,0.10)',  color:'#FCD34D', border:'rgba(252,211,77,0.3)',  hoverBg:'rgba(252,211,77,0.16)' },
};
const BUTTON_SIZES: Record<ButtonSize, { padding: string; fontSize: string; gap: string }> = {
  sm: { padding:'0.375rem 0.875rem', fontSize:'0.8125rem', gap:'0.375rem' },
  md: { padding:'0.625rem 1.375rem', fontSize:'0.9375rem', gap:'0.5rem' },
  lg: { padding:'0.875rem 2rem',     fontSize:'1rem',      gap:'0.625rem' },
};

export const Button: React.FC<ButtonProps> = ({
  children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false,
  type = 'button', fullWidth = false, icon, className = '', style, title,
}) => {
  const [hov, setHov] = React.useState(false);
  const vs = BUTTON_STYLES[variant];
  const ss = BUTTON_SIZES[size];
  const isPrimary = variant === 'primary';
  const bg = isPrimary
    ? (disabled || loading ? 'rgba(124,255,58,0.25)' : (hov ? 'linear-gradient(180deg,#8CFF4A 0%,#6FE328 40%,#35900D 100%)' : vs.bg))
    : (hov && !disabled ? vs.hoverBg : vs.bg);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ss.gap,
        padding: ss.padding,
        fontSize: ss.fontSize,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        borderRadius: '9999px',
        border: `1px solid ${vs.border}`,
        background: bg,
        color: disabled || loading ? 'rgba(255,255,255,0.3)' : vs.color,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled && !loading ? 0.55 : 1,
        boxShadow: isPrimary && hov && !disabled ? '0 0 18px rgba(124,255,58,0.30)' : 'none',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', flexShrink: 0 }} /> : icon}
      {children}
    </button>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'violet' | 'cyan' | 'amber' | 'rose' | 'blue' | 'muted';

const BADGE_COLORS: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  green:  { bg: C.greenDim,  color: '#7CFF3A', border: C.greenBorder },
  violet: { bg: C.violetDim, color: '#A78BFA', border: C.violetBorder },
  cyan:   { bg: C.cyanDim,   color: '#22D3EE', border: C.cyanBorder },
  amber:  { bg: C.amberDim,  color: '#FCD34D', border: C.amberBorder },
  rose:   { bg: C.roseDim,   color: '#FB7185', border: C.roseBorder },
  blue:   { bg: C.blueDim,   color: '#60A5FA', border: C.blueBorder },
  muted:  { bg: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'rgba(255,255,255,0.1)' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'muted', size = 'sm', dot = false, style }) => {
  const bc = BADGE_COLORS[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: size === 'sm' ? '0.2rem 0.625rem' : '0.3rem 0.875rem',
      fontSize: size === 'sm' ? '0.6875rem' : '0.8125rem',
      fontWeight: 600, borderRadius: '9999px',
      background: bc.bg, color: bc.color,
      border: `1px solid ${bc.border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: bc.color, flexShrink: 0 }} />}
      {children}
    </span>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, wrapperStyle, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...wrapperStyle }}>
      {label && (
        <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: C.textSecondary, fontFamily: 'var(--font-body)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${error ? C.roseBorder : focused ? C.greenBorder : C.surfaceBorder}`,
          borderRadius: '0.625rem',
          color: '#fff',
          fontSize: '0.9375rem',
          fontFamily: 'var(--font-body)',
          outline: 'none',
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(251,113,133,0.10)' : 'rgba(124,255,58,0.08)'}` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...props.style,
        }}
      />
      {error && <span style={{ fontSize: '0.75rem', color: C.rose }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.75rem', color: C.textMuted }}>{hint}</span>}
    </div>
  );
};

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({ label, error, wrapperStyle, children, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...wrapperStyle }}>
      {label && <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: C.textSecondary }}>{label}</label>}
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '0.65rem 1rem',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${error ? C.roseBorder : focused ? C.greenBorder : C.surfaceBorder}`,
          borderRadius: '0.625rem', color: '#fff',
          fontSize: '0.9375rem', fontFamily: 'var(--font-body)',
          outline: 'none', cursor: 'pointer',
          transition: 'border-color 0.2s',
          ...props.style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '0.75rem', color: C.rose }}>{error}</span>}
    </div>
  );
};

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const ALERT_CONFIG: Record<AlertVariant, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  info:    { bg: C.blueDim,   border: C.blueBorder,   color: C.blue,   icon: <Info style={{ width:16, height:16, flexShrink:0 }} /> },
  success: { bg: C.greenDim,  border: C.greenBorder,  color: C.green,  icon: <CheckCircle2 style={{ width:16, height:16, flexShrink:0 }} /> },
  warning: { bg: C.amberDim,  border: C.amberBorder,  color: C.amber,  icon: <AlertTriangle style={{ width:16, height:16, flexShrink:0 }} /> },
  error:   { bg: C.roseDim,   border: C.roseBorder,   color: C.rose,   icon: <AlertCircle style={{ width:16, height:16, flexShrink:0 }} /> },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, action, style }) => {
  const ac = ALERT_CONFIG[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '1rem 1.25rem',
      background: ac.bg, border: `1px solid ${ac.border}`,
      borderRadius: '0.875rem', ...style,
    }}>
      <span style={{ color: ac.color, marginTop: 1 }}>{ac.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{title}</p>}
        <div style={{ fontSize: '0.875rem', color: C.textSecondary, lineHeight: 1.6 }}>{children}</div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  valueColor?: string;
  masked?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, valueColor = '#fff', masked = false }) => (
  <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8125rem', color: C.textMuted }}>{label}</span>
      {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.625rem', fontWeight: 700, color: masked ? C.textDim : valueColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {masked ? '••••••••' : value}
    </div>
    {sub && <span style={{ fontSize: '0.75rem', color: C.textDim }}>{sub}</span>}
  </Card>
);

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  iconAccent?: 'green' | 'violet' | 'cyan' | 'amber' | 'rose';
}

const ICON_ACCENT_COLORS: Record<string, { bg: string; border: string }> = {
  green:  { bg: C.greenDim,  border: C.greenBorder  },
  violet: { bg: C.violetDim, border: C.violetBorder },
  cyan:   { bg: C.cyanDim,   border: C.cyanBorder   },
  amber:  { bg: C.amberDim,  border: C.amberBorder  },
  rose:   { bg: C.roseDim,   border: C.roseBorder   },
};

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, badge, action, iconAccent = 'green' }) => {
  const ac = ICON_ACCENT_COLORS[iconAccent];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {icon && (
          <div style={{
            width: 48, height: 48, borderRadius: '0.875rem',
            background: ac.bg, border: `1px solid ${ac.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && <p style={{ fontSize: '0.875rem', color: C.textMuted, marginTop: '0.375rem', maxWidth: '52rem', lineHeight: 1.6 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
    {icon
      ? <div style={{ color: C.textDim, marginBottom: '0.5rem' }}>{icon}</div>
      : <Shield style={{ width: 48, height: 48, color: C.textDim }} />
    }
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h3>
    {description && <p style={{ fontSize: '0.9375rem', color: C.textMuted, maxWidth: '36rem', lineHeight: 1.6, margin: 0 }}>{description}</p>}
    {action}
  </div>
);

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export const SectionLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', ...style }}>
    <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, fontFamily: 'var(--font-body)' }}>
      {children}
    </span>
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: React.CSSProperties;
}

export function Tabs<T extends string>({ options, value, onChange, style }: TabsProps<T>) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9999px', width: 'fit-content', ...style }}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={{
            padding: '0.4rem 1rem', borderRadius: '9999px',
            fontSize: '0.875rem', fontWeight: 600,
            fontFamily: 'var(--font-body)', cursor: 'pointer',
            border: 'none', transition: 'all 0.2s',
            background: value === o.id ? 'linear-gradient(180deg,#7CFF3A 0%,#5FD318 40%,#2E7D0B 100%)' : 'transparent',
            color: value === o.id ? '#0a1a02' : C.textSecondary,
            boxShadow: value === o.id ? '0 0 10px rgba(124,255,58,0.2)' : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── PropertySelector ─────────────────────────────────────────────────────────

interface PropertySelectorProps {
  properties: Array<{ id: string; name: string; location: string; availableShares: bigint }>;
  selectedId: string;
  onSelect: (id: string) => void;
  getExtra?: (id: string) => React.ReactNode;
  accent?: 'green' | 'violet';
}

export const PropertySelector: React.FC<PropertySelectorProps> = ({
  properties, selectedId, onSelect, getExtra, accent = 'green',
}) => {
  const accentColors = accent === 'violet'
    ? { border: C.violetBorder, bg: C.violetDim }
    : { border: C.greenBorder, bg: C.greenDim };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
      {properties.map(p => {
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              gap: '0.75rem', padding: '1rem', borderRadius: '0.875rem',
              border: `1px solid ${selected ? accentColors.border : C.surfaceBorder}`,
              background: selected ? accentColors.bg : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: C.textMuted }}>{p.location}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: selected ? (accent === 'violet' ? C.violet : C.green) : C.textMuted }}>{p.id}</span>
              {getExtra ? getExtra(p.id) : (
                <span style={{ color: C.textDim }}>{Number(p.availableShares).toLocaleString()} avail.</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── ProofResult ──────────────────────────────────────────────────────────────

interface ProofResultCardProps {
  result: { publicClaim: string; zkirCircuit: string; proofHash: string; disclosedData: Record<string, string | number> };
  privateLabel?: string;
  actualValueLabel?: string;
}

export const ProofResultCard: React.FC<ProofResultCardProps> = ({ result, privateLabel = 'Your private value', actualValueLabel }) => (
  <div style={{
    padding: '1.5rem', borderRadius: '1rem',
    background: C.greenDim, border: `1px solid ${C.greenBorder}`,
    display: 'flex', flexDirection: 'column', gap: '1rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <CheckCircle2 style={{ width: 20, height: 20, color: C.green }} />
      <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Proof Generated & Verified</span>
    </div>
    <div style={{ background: C.surface, border: `1px solid ${C.surfaceBorder}`, borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
      {[
        ['Public Claim', result.publicClaim],
        ['ZK Circuit', result.zkirCircuit],
        ['Identity Commitment', result.proofHash.slice(0, 24) + '…'],
        ['Ledger Update', 'Audit counter incremented on-chain'],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ color: C.textMuted }}>{k}:</span>
          <span style={{ color: '#fff', fontFamily: typeof k === 'string' && k.includes('Circuit') || k.includes('Commit') ? 'var(--font-mono)' : 'inherit', fontWeight: 500, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
      {actualValueLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${C.surfaceBorder}` }}>
          <span style={{ color: C.textMuted }}>{privateLabel}:</span>
          <Badge variant="cyan">🔒 NOT DISCLOSED</Badge>
        </div>
      )}
    </div>
    <Alert variant="info">
      The verifier receives mathematical certainty about the claim. Your underlying values remain strictly private.
    </Alert>
  </div>
);

// ─── PrivateField ─────────────────────────────────────────────────────────────

interface PrivateFieldProps {
  label: string;
  value: React.ReactNode;
  masked?: boolean;
  icon?: React.ReactNode;
  accent?: 'cyan' | 'violet' | 'green';
  style?: React.CSSProperties;
}

export const PrivateField: React.FC<PrivateFieldProps> = ({ label, value, masked = false, icon, accent = 'cyan', style }) => {
  const col = accent === 'cyan' ? C.cyan : accent === 'violet' ? C.violet : C.green;
  return (
    <div style={{
      padding: '0.875rem 1rem', borderRadius: '0.75rem',
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.surfaceBorder}`,
      display: 'flex', flexDirection: 'column', gap: '0.375rem',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, fontWeight: 600 }}>{label}</span>
        {icon || <span style={{ fontSize: '0.625rem', color: col, letterSpacing: '0.05em', fontWeight: 700 }}>🔒 SHIELDED</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: masked ? C.textDim : '#fff' }}>
        {masked ? '••••••••••' : value}
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = C.green }) => (
  <RefreshCw style={{ width: size, height: size, color, animation: 'spin 1s linear infinite' }} />
);

// ─── Table helpers ────────────────────────────────────────────────────────────

export const Table: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.875rem', ...style }}>
      {children}
    </table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.surfaceBorder}` }}>
    {children}
  </thead>
);

export const TH: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' | 'center' }> = ({ children, align = 'left' }) => (
  <th style={{ padding: '0.75rem 1rem', textAlign: align, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textMuted, whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

export const TR: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderBottom: `1px solid ${C.surfaceBorder}`, background: hov ? 'rgba(255,255,255,0.025)' : 'transparent', transition: 'background 0.15s', cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </tr>
  );
};

export const TD: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' | 'center'; mono?: boolean }> = ({ children, align = 'left', mono = false }) => (
  <td style={{ padding: '0.875rem 1rem', textAlign: align, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', color: C.textSecondary, verticalAlign: 'middle' }}>
    {children}
  </td>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, children, maxWidth = 540 }) => {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(5,8,5,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#0E120E', border: `1px solid ${C.surfaceBorderMd}`, borderRadius: '1.25rem', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.375rem 1.5rem', borderBottom: `1px solid ${C.surfaceBorder}` }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: '#fff' }}>{title}</h3>
            {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: C.textMuted }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: '0.25rem', borderRadius: '0.375rem', display: 'flex', fontSize: '1.25rem', lineHeight: 1 }} aria-label="Close">✕</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

export const ProgressBar: React.FC<{ value: number; max: number; label?: string; color?: string }> = ({
  value, max, label, color = C.green,
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      {label && <div style={{ fontSize: '0.75rem', color: C.textMuted, marginBottom: '0.375rem' }}>{label}</div>}
      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ height: 1, background: C.surfaceBorder, width: '100%', ...style }} />
);

// ─── ShieldedValueRow (portfolio table cell) ───────────────────────────────────

export const ShieldedValue: React.FC<{ value: React.ReactNode; masked?: boolean; color?: string }> = ({
  value, masked = false, color = '#fff',
}) => (
  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: masked ? C.textDim : color }}>
    {masked ? '••••••••' : value}
  </span>
);
