'use client'

import { BarChart3, Target, Megaphone, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { NavigationItem } from '../molecules/NavigationItem'
import { Badge } from '../atoms/Badge'
import { Text } from '../atoms/Typography'
import { Divider } from '../atoms/Divider'

interface SidebarProps {
  activeHref?: string
  accountName?: string
  isDemo?: boolean
  userEmail?: string
  onSignOut?: () => void
  collapsed?: boolean
}

const navItems = [
  { label: 'Visão Geral', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Por Objetivo', href: '/dashboard/objectives', icon: <Target size={16} /> },
  { label: 'Campanhas', href: '/dashboard/campaigns', icon: <Megaphone size={16} /> },
  { label: 'Receita', href: '/dashboard/revenue', icon: <BarChart3 size={16} /> },
]

export function Sidebar({
  activeHref = '/dashboard',
  accountName,
  isDemo = false,
  userEmail,
  onSignOut,
  collapsed = false,
}: SidebarProps) {
  return (
    <aside
      className={[
        'flex flex-col h-full bg-surface border-r border-border',
        collapsed ? 'w-14' : 'w-56',
        'transition-all duration-200',
      ].join(' ')}
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className={['flex items-center gap-2 px-4 py-5', collapsed ? 'justify-center' : ''].join(' ')}>
        <div className="w-7 h-7 bg-amber-500 rounded-sm flex-shrink-0 flex items-center justify-center">
          <span className="text-text-inverse font-mono font-bold text-[11px]">H3</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-sans font-semibold text-body-sm text-text-primary">H3 Dashboard</span>
            {isDemo && <Badge variant="demo" size="sm" className="mt-0.5 self-start">DEMO</Badge>}
          </div>
        )}
      </div>

      {accountName && !collapsed && (
        <div className="px-4 pb-3">
          <Text size="xs" variant="tertiary" className="truncate">{accountName}</Text>
        </div>
      )}

      <Divider />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavigationItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={activeHref === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <Divider />

      {/* Footer */}
      <div className="px-2 py-3 flex flex-col gap-0.5">
        <NavigationItem
          label="Configurações"
          href="/dashboard/settings"
          icon={<Settings size={16} />}
          active={activeHref === '/dashboard/settings'}
          collapsed={collapsed}
        />
        {userEmail && !collapsed && (
          <div className="px-3 py-2">
            <Text size="xs" variant="tertiary" className="truncate">{userEmail}</Text>
          </div>
        )}
        {onSignOut && (
          <NavigationItem
            label="Sair"
            icon={<LogOut size={16} />}
            onClick={onSignOut}
            collapsed={collapsed}
          />
        )}
      </div>
    </aside>
  )
}
