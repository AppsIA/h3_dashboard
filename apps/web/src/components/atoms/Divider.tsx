interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
  label?: string
}

export function Divider({ orientation = 'horizontal', className = '', label }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-border self-stretch ${className}`} aria-hidden />
  }

  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`} role="separator">
        <div className="flex-1 h-px bg-border" aria-hidden />
        <span className="text-caption text-text-tertiary font-sans whitespace-nowrap">{label}</span>
        <div className="flex-1 h-px bg-border" aria-hidden />
      </div>
    )
  }

  return <hr className={`border-0 h-px bg-border ${className}`} aria-hidden />
}
