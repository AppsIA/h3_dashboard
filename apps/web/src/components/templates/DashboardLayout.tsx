'use client'

import { type ReactNode, useState } from 'react'
import { Sidebar } from '../organisms/Sidebar'
import { Topbar } from '../organisms/Topbar'
import { DemoBar } from '../organisms/DemoBar'

interface Account {
  id: string
  name: string
  is_demo?: boolean
}

interface DateRange {
  from: Date
  to: Date
}

interface DashboardLayoutProps {
  children: ReactNode
  accounts: Account[]
  activeAccountId: string | null
  onAccountChange: (id: string) => void
  activeHref?: string
  userEmail?: string
  onSignOut?: () => void
  lastSync?: Date | null
  syncing?: boolean
  onRefresh?: () => void
}

const defaultRange = (): DateRange => {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 30)
  return { from, to }
}

export function DashboardLayout({
  children,
  accounts,
  activeAccountId,
  onAccountChange,
  activeHref,
  userEmail,
  onSignOut,
  lastSync,
  syncing,
  onRefresh,
}: DashboardLayoutProps) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const activeAccount = accounts.find((a) => a.id === activeAccountId)
  const isDemo = activeAccount?.is_demo ?? false

  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden">
      {isDemo && <DemoBar accountName={activeAccount?.name} />}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeHref={activeHref}
          accountName={activeAccount?.name}
          isDemo={isDemo}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            accounts={accounts}
            activeAccountId={activeAccountId}
            onAccountChange={onAccountChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            lastSync={lastSync}
            syncing={syncing}
            onRefresh={onRefresh}
          />

          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
