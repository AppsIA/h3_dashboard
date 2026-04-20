type ObjectiveType =
  | 'awareness'
  | 'consideration'
  | 'conversion'
  | 'lead_gen'
  | 'retention'
  | 'upsell'

const objectiveConfig: Record<ObjectiveType, { label: string; className: string }> = {
  awareness: {
    label: 'Awareness',
    className: 'bg-objective-awareness/10 text-objective-awareness border border-objective-awareness/20',
  },
  consideration: {
    label: 'Consideração',
    className: 'bg-objective-consideration/10 text-objective-consideration border border-objective-consideration/20',
  },
  conversion: {
    label: 'Conversão',
    className: 'bg-objective-conversion/10 text-objective-conversion border border-objective-conversion/20',
  },
  lead_gen: {
    label: 'Lead Gen',
    className: 'bg-objective-lead_gen/10 text-objective-lead_gen border border-objective-lead_gen/20',
  },
  retention: {
    label: 'Retenção',
    className: 'bg-objective-retention/10 text-objective-retention border border-objective-retention/20',
  },
  upsell: {
    label: 'Upsell',
    className: 'bg-objective-upsell/10 text-objective-upsell border border-objective-upsell/20',
  },
}

interface ObjectiveBadgeProps {
  objective: ObjectiveType
  size?: 'sm' | 'md'
  className?: string
}

export function ObjectiveBadge({ objective, size = 'md', className = '' }: ObjectiveBadgeProps) {
  const config = objectiveConfig[objective]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-caption px-2 py-1'

  return (
    <span
      className={[
        'inline-flex items-center font-sans rounded-chip whitespace-nowrap leading-none',
        sizeClass,
        config.className,
        className,
      ].filter(Boolean).join(' ')}
    >
      {config.label}
    </span>
  )
}
