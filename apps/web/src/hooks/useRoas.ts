'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { OverviewResponse } from '@h3/shared'

export function useOverview(accountId: string, from?: string, to?: string) {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    api.overview(accountId, from, to)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [accountId, from, to])

  return { data, loading, error }
}

export function useRoasSeries(
  accountId: string,
  from?: string,
  to?: string,
  granularity?: 'daily' | 'weekly' | 'monthly'
) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    api.roas(accountId, from, to, granularity)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [accountId, from, to, granularity])

  return { data, loading, error }
}
