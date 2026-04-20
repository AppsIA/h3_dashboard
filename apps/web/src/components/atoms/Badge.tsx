import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'amber' | 'success' | 'error' | 'warning' | 'info' | 'demo'
type BadgeSize    = 'sm' | 'md'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-text-secondary border border-border',
  amber:   'bg-amber-900 text-amber-500 border border-amber-500/30',
  success: 'bg-success-bg text-success border border-success/20',
  error:   'bg-error-bg text-error border border-error/20',
  warning: 'bg-warning-bg text-warning border border-warning/20',
  info:    'bg-info-bg text-info border border-info/20',
  demo:    'bg-amber-500 text-text-inverse font-semibold',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-caption px-2 py-1 gap-1.5',
}

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-sans rounded-chip',
        'whitespace-nowrap leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon && <span aria-hidden className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
