import type { ReactNode } from 'react'
import { Badge } from '../atoms/Badge'

interface NavigationItemProps {
  label: string
  icon?: ReactNode
  href?: string
  active?: boolean
  badge?: string | number
  collapsed?: boolean
  onClick?: () => void
}

export function NavigationItem({
  label,
  icon,
  href,
  active = false,
  badge,
  collapsed = false,
  onClick,
}: NavigationItemProps) {
  const baseClass = [
    'flex items-center gap-3 px-3 py-2 rounded-sm transition-colors cursor-pointer',
    'text-body-sm font-sans font-medium',
    active
      ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20'
      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
  ].join(' ')

  const content = (
    <>
      {icon && (
        <span className={['flex-shrink-0', active ? 'text-amber-400' : 'text-text-tertiary'].join(' ')} aria-hidden>
          {icon}
        </span>
      )}
      {!collapsed && (
        <span className="flex-1 truncate">{label}</span>
      )}
      {!collapsed && badge !== undefined && (
        <Badge variant="default" size="sm">{badge}</Badge>
      )}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={baseClass}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? label : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={baseClass}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      {content}
    </button>
  )
}
