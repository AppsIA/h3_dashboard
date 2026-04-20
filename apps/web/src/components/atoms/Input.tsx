import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftElement?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  leftElement,
  rightElement,
  id,
  className = '',
  disabled,
  ...props
}, ref) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
  const hintId  = hint  ? `${inputId}-hint`  : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-label-upper uppercase font-mono text-text-secondary tracking-widest"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftElement && (
          <span className="absolute left-3 text-text-tertiary" aria-hidden>
            {leftElement}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          className={[
            'w-full bg-surface-elevated',
            'border border-border',
            'rounded-sm',
            'text-body text-text-primary font-sans',
            'h-9 px-3',
            leftElement  && 'pl-9',
            rightElement && 'pr-9',
            'placeholder:text-text-tertiary',
            'transition-all duration-150',
            'outline-none',
            'focus:border-amber-500 focus:shadow-focus',
            error && 'border-error focus:shadow-error',
            disabled && 'opacity-40 cursor-not-allowed bg-surface',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {rightElement && (
          <span className="absolute right-3 text-text-tertiary" aria-hidden>
            {rightElement}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-caption text-text-tertiary">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
