import { Loader2 } from 'lucide-react'

type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<SpinnerSize, number> = { sm: 14, md: 18, lg: 24 }

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

export function Spinner({ size = 'md', className = '', label = 'Carregando...' }: SpinnerProps) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={`animate-spin text-amber-500 ${className}`}
      aria-hidden="false"
      aria-label={label}
      role="status"
    />
  )
}
