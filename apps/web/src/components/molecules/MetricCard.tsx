import type { ReactNode } from 'react'
import { Metric, FormulaLabel, Text, UpperLabel } from '../atoms/Typography'
import { Skeleton } from '../atoms/Skeleton'
import { Badge } from '../atoms/Badge'

interface MetricCardProps {
  label: string
  value: ReactNode
  formulaLabel?: string
  trend?: {
    value: number
    period?: string
  }
  subtitle?: string
  action?: ReactNode
  loading?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const metricSizeMap = {
  sm: 'sm' as const,
  md: 'med' as const,
  lg: 'large' as const,
}

function TrendBadge({ value, period }: { value: number; period?: string }) {
  const isPositive = value >= 0
  const variant = isPositive ? 'success' : 'error'
  const sign = isPositive ? '+' : ''
  return (
    <Badge variant={variant} size="sm">
      {sign}{value.toFixed(1)}%{period ? ` vs ${period}` : ''}
    </Badge>
  )
}

export function MetricCard({
  label,
  value,
  formulaLabel,
  trend,
  subtitle,
  action,
  loading = false,
  className = '',
  size = 'md',
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={`bg-surface border border-border rounded-sm ${sizeClasses[size]} ${className}`}>
        <Skeleton className="h-2 w-20 mb-4" />
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-2 w-48" />
      </div>
    )
  }

  return (
    <div
      className={`bg-surface border border-border rounded-sm ${sizeClasses[size]} flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <UpperLabel>{label}</UpperLabel>
        {action}
      </div>

      <div className="flex flex-col gap-1">
        <Metric size={metricSizeMap[size]} amber={formulaLabel !== undefined}>
          {value}
        </Metric>
        {formulaLabel && <FormulaLabel label={formulaLabel} />}
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-2 flex-wrap">
          {trend !== undefined && <TrendBadge value={trend.value} period={trend.period} />}
          {subtitle && (
            <Text size="xs" variant="tertiary">
              {subtitle}
            </Text>
          )}
        </div>
      )}
    </div>
  )
}
