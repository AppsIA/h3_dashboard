'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function useAccounts() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.accounts.list()
      .then(setAccounts)
      .finally(() => setLoading(false))
  }, [])

  return { accounts, loading }
}

export function useAccount(accountId: string) {
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return
    api.accounts.get(accountId)
      .then(setAccount)
      .finally(() => setLoading(false))
  }, [accountId])

  return { account, loading }
}
