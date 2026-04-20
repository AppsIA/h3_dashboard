import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// ─── Variantes ────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-amber-500 text-text-inverse hover:bg-amber-400 active:bg-amber-600 focus-visible:shadow-focus',
  secondary: 'bg-surface-elevated text-text-primary border border-border hover:bg-surface-overlay active:bg-surface hover:border-border-strong focus-visible:shadow-focus',
  ghost:     'bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary focus-visible:shadow-focus',
  danger:    'bg-error/10 text-error border border-error/30 hover:bg-error/20 focus-visible:shadow-error',
  outline:   'bg-transparent text-amber-500 border border-amber-500 hover:bg-amber-500/10 focus-visible:shadow-focus',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-7 px-3 text-body-sm gap-1.5',
  md:   'h-9 px-4 text-body gap-2',
  lg:   'h-11 px-6 text-body-lg gap-2',
  icon: 'h-9 w-9 p-0',
}

// ─── Props ────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        // Base
        'inline-flex items-center justify-center',
        'font-sans font-medium',
        'rounded-sm',
        'transition-all duration-150 ease-smooth',
        'outline-none focus-visible:ring-0',
        'select-none cursor-pointer',
        // Disabled
        isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        // Width
        fullWidth && 'w-full',
        // Variant + size
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} aria-hidden />
      ) : leftIcon ? (
        <span aria-hidden className="flex-shrink-0">{leftIcon}</span>
      ) : null}

      {size !== 'icon' && children}

      {!loading && rightIcon && (
        <span aria-hidden className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
