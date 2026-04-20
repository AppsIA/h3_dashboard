import type { ReactNode } from 'react'
import { Metric, FormulaLabel, Text, UpperLabel } from '../atoms/Typography'
import { Divider } from '../atoms/Divider'
import { Skeleton } from '../atoms/Skeleton'

export interface StatItem {
  label: string
  value: ReactNode
  formulaLabel?: string
  amber?: boolean
}

interface StatGroupProps {
  stats: StatItem[]
  orientation?: 'horizontal' | 'vertical'
  loading?: boolean
  className?: string
}

export function StatGroup({
  stats,
  orientation = 'horizontal',
  loading = false,
  className = '',
}: StatGroupProps) {
  if (loading) {
    return (
      <div className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} gap-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 min-w-[100px]">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={[
        'flex',
        orientation === 'horizontal' ? 'flex-row items-start flex-wrap gap-0' : 'flex-col gap-4',
        className,
      ].join(' ')}
    >
      {stats.map((stat, i) => (
        <div key={i} className="flex">
          <div className="flex flex-col gap-1 px-4 first:pl-0">
            <UpperLabel>{stat.label}</UpperLabel>
            <Metric size="sm" amber={stat.amber}>
              {stat.value}
            </Metric>
            {stat.formulaLabel && <FormulaLabel label={stat.formulaLabel} />}
          </div>
          {orientation === 'horizontal' && i < stats.length - 1 && (
            <Divider orientation="vertical" className="mx-0 self-stretch" />
          )}
        </div>
      ))}
    </div>
  )
}
