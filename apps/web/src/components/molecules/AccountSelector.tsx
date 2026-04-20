'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'
import { Badge } from '../atoms/Badge'
import { Text } from '../atoms/Typography'
import { Spinner } from '../atoms/Spinner'

interface Account {
  id: string
  name: string
  is_demo?: boolean
}

interface AccountSelectorProps {
  accounts: Account[]
  value: string | null
  onChange: (accountId: string) => void
  loading?: boolean
  className?: string
}

export function AccountSelector({
  accounts,
  value,
  onChange,
  loading = false,
  className = '',
}: AccountSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = accounts.find((a) => a.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-sm hover:border-border-focus transition-colors min-w-[180px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 size={14} className="text-text-tertiary flex-shrink-0" aria-hidden />
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <span className="flex-1 text-body-sm font-sans text-text-primary truncate text-left">
            {active?.name ?? 'Selecionar conta'}
          </span>
        )}
        {active?.is_demo && <Badge variant="demo" size="sm">DEMO</Badge>}
        <ChevronDown
          size={14}
          className={['text-text-tertiary flex-shrink-0 transition-transform', open ? 'rotate-180' : ''].join(' ')}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Selecionar conta"
          className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-surface border border-border rounded-sm shadow-md z-50 py-1 max-h-60 overflow-y-auto"
        >
          {accounts.length === 0 && (
            <li className="px-3 py-2">
              <Text size="xs" variant="tertiary">Nenhuma conta disponível</Text>
            </li>
          )}
          {accounts.map((account) => (
            <li key={account.id} role="option" aria-selected={account.id === value}>
              <button
                type="button"
                onClick={() => { onChange(account.id); setOpen(false) }}
                className={[
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-body-sm font-sans transition-colors',
                  account.id === value
                    ? 'bg-amber-900/20 text-amber-400'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                ].join(' ')}
              >
                <span className="flex-1 truncate">{account.name}</span>
                {account.is_demo && <Badge variant="demo" size="sm">DEMO</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
