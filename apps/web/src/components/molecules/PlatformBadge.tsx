import type { ReactNode } from 'react'

type Platform = 'meta' | 'google' | 'crm' | 'organic'

const platformConfig: Record<Platform, { label: string; className: string; icon?: ReactNode }> = {
  meta: {
    label: 'Meta',
    className: 'bg-platform-meta/10 text-platform-meta border border-platform-meta/20',
  },
  google: {
    label: 'Google',
    className: 'bg-platform-google/10 text-platform-google border border-platform-google/20',
  },
  crm: {
    label: 'CRM',
    className: 'bg-surface-elevated text-text-secondary border border-border',
  },
  organic: {
    label: 'Orgânico',
    className: 'bg-success-bg text-success border border-success/20',
  },
}

interface PlatformBadgeProps {
  platform: Platform
  size?: 'sm' | 'md'
  className?: string
}

export function PlatformBadge({ platform, size = 'md', className = '' }: PlatformBadgeProps) {
  const config = platformConfig[platform]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-caption px-2 py-1'

  return (
    <span
      className={[
        'inline-flex items-center font-mono rounded-chip whitespace-nowrap leading-none',
        sizeClass,
        config.className,
        className,
      ].filter(Boolean).join(' ')}
    >
      {config.label}
    </span>
  )
}
