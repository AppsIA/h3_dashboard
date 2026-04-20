interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: boolean
}

export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'bg-surface-elevated animate-skeleton',
        rounded ? 'rounded-full' : 'rounded-sm',
        className,
      ].filter(Boolean).join(' ')}
      style={{ width, height }}
    />
  )
}

// Preset: bloco de texto
export function SkeletonText({ lines = 2, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' } as any}
        />
      ))}
    </div>
  )
}

// Preset: card de métrica
export function SkeletonMetricCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-sm p-6 ${className}`} aria-hidden>
      <Skeleton className="h-2 w-20 mb-4" />
      <Skeleton className="h-10 w-32 mb-2" />
      <Skeleton className="h-2 w-48" />
    </div>
  )
}

// Preset: linha de tabela
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" style={{ width: `${60 + (i % 3) * 15}%` } as any} />
        </td>
      ))}
    </tr>
  )
}
