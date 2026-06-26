import React from 'react';
import { cn } from '../utils';

export type TextVariant = 'caption' | 'body' | 'heading' | 'title' | 'label';

interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'label';
  muted?: boolean;
  accent?: boolean;
  mono?: boolean;
}

const variantStyles: Record<TextVariant, string> = {
  caption: 'text-[10px] font-black uppercase tracking-[0.2em]',
  label: 'text-[9px] font-black uppercase tracking-[0.15em]',
  body: 'text-[13px] leading-relaxed',
  heading: 'text-sm font-bold',
  title: 'text-xl font-bold tracking-tight',
};

function tagForVariant(variant: TextVariant): React.ElementType {
  switch (variant) {
    case 'title': return 'h2';
    case 'heading': return 'h3';
    case 'body': return 'p';
    case 'caption': return 'span';
    case 'label': return 'span';
  }
}

export const Text: React.FC<TextProps> = ({ variant = 'body', children, className, as, muted, accent, mono }) => {
  const Comp = as || tagForVariant(variant as TextVariant);
  const v = variantStyles[variant as TextVariant];
  return (
    <Comp
      className={cn(
        v,
        muted && 'text-white/40',
        accent && 'text-[var(--color-accent)]',
        mono && 'font-mono',
        !muted && !accent && 'text-white/80',
        className,
      )}
    >
      {children}
    </Comp>
  );
};

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="caption" {...props} />;
export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="body" {...props} />;
export const Heading: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="heading" {...props} />;
export const Title: React.FC<Omit<TextProps, 'variant'>> = (props) => <Text variant="title" {...props} />;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:opacity-90 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.2)]',
  secondary: 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10',
  ghost: 'bg-transparent text-white/40 hover:text-white/70 hover:bg-white/5',
  danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
};

const btnSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[9px] rounded-lg',
  md: 'px-4 py-2 text-[10px] rounded-xl',
  lg: 'px-6 py-3 text-[11px] rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'md', children, icon, loading, className, disabled, ...props }) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
      btnVariants[variant],
      btnSizes[size],
      loading && 'animate-pulse',
      className,
    )}
    {...props}
  >
    {loading ? <RefreshIcon /> : icon}
    {children}
  </button>
);

const RefreshIcon = () => (
  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
  </svg>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void }> = ({ children, className, hover, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      'bg-white/5 border border-white/10 rounded-3xl p-5',
      hover && 'hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer',
      className,
    )}
  >
    {children}
  </div>
);

export type BadgeVariant = 'active' | 'pending' | 'error' | 'info';

const badgeStyles: Record<BadgeVariant, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: BadgeVariant; className?: string }> = ({ children, variant = 'info', className }) => (
  <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border', badgeStyles[variant], className)}>
    {children}
  </span>
);