'use client'

import { RefreshCw } from 'lucide-react'
import { AccountSelector } from '../molecules/AccountSelector'
import { DateRangePicker } from '../molecules/DateRangePicker'
import { Button } from '../atoms/Button'
import { Text } from '../atoms/Typography'

interface Account {
  id: string
  name: string
  is_demo?: boolean
}

interface DateRange {
  from: Date
  to: Date
}

interface TopbarProps {
  accounts: Account[]
  activeAccountId: string | null
  onAccountChange: (id: string) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  lastSync?: Date | null
  syncing?: boolean
  onRefresh?: () => void
  className?: string
}

export function Topbar({
  accounts,
  activeAccountId,
  onAccountChange,
  dateRange,
  onDateRangeChange,
  lastSync,
  syncing = false,
  onRefresh,
  className = '',
}: TopbarProps) {
  return (
    <header
      className={[
        'flex items-center gap-3 px-6 py-3 bg-surface border-b border-border flex-wrap',
        className,
      ].join(' ')}
      aria-label="Barra de controles"
    >
      <AccountSelector
        accounts={accounts}
        value={activeAccountId}
        onChange={onAccountChange}
      />

      <div className="flex-1 min-w-0" />

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />

      <div className="flex items-center gap-2">
        {lastSync && !syncing && (
          <Text size="xs" variant="tertiary" as="span" className="hidden sm:inline">
            Sync {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            loading={syncing}
            aria-label="Atualizar dados"
          >
            <RefreshCw size={14} />
          </Button>
        )}
      </div>
    </header>
  )
}
