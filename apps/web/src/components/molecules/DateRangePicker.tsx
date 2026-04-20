'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '../atoms/Button'
import { Text } from '../atoms/Typography'

type Preset = '7d' | '30d' | '90d' | 'custom'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presets: { label: string; value: Preset; days?: number }[] = [
  { label: '7d', value: '7d', days: 7 },
  { label: '30d', value: '30d', days: 30 },
  { label: '90d', value: '90d', days: 90 },
]

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<Preset>('30d')

  function applyPreset(preset: (typeof presets)[number]) {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - (preset.days ?? 30))
    setActivePreset(preset.value)
    onChange({ from, to })
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-sm p-0.5">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => applyPreset(p)}
            className={[
              'px-3 py-1.5 text-caption font-mono rounded-[2px] transition-colors',
              activePreset === p.value
                ? 'bg-surface text-amber-400 shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border rounded-sm">
        <Calendar size={14} className="text-text-tertiary flex-shrink-0" aria-hidden />
        <Text size="xs" variant="secondary" as="span">
          {formatDate(value.from)} — {formatDate(value.to)}
        </Text>
      </div>
    </div>
  )
}
