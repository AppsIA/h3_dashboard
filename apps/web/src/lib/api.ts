/**
 * Cliente HTTP para a API Fastify (apps/api).
 * Injetado com o token do Supabase Auth automaticamente.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  // No browser: busca sessão do Supabase
  if (typeof window !== 'undefined') {
    const { createSupabaseBrowser } = await import('./supabase')
    const supabase = createSupabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }
  return null
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? `API error ${res.status}`)
  }

  return res.json()
}

// ─── Endpoints tipados ────────────────────────────────────────────────────

import type {
  OverviewResponse,
  CampaignAttributionResponse,
} from '@h3/shared'

export const api = {
  accounts: {
    list: () => apiFetch<any[]>('/accounts'),
    get: (id: string) => apiFetch<any>(`/accounts/${id}`),
  },

  overview: (accountId: string, from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to)   params.set('to', to)
    const qs = params.toString()
    return apiFetch<OverviewResponse>(`/accounts/${accountId}/overview${qs ? '?' + qs : ''}`)
  },

  roas: (accountId: string, from?: string, to?: string, granularity?: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to)   params.set('to', to)
    if (granularity) params.set('granularity', granularity)
    return apiFetch<any>(`/accounts/${accountId}/roas?${params}`)
  },

  objectives: {
    list: (accountId: string, from?: string, to?: string) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      return apiFetch<any[]>(`/accounts/${accountId}/objectives?${params}`)
    },
    metrics: (accountId: string, objectiveId: string, from?: string, to?: string) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      return apiFetch<any>(`/accounts/${accountId}/objectives/${objectiveId}/metrics?${params}`)
    },
  },

  campaigns: {
    list: (accountId: string, opts?: { objectiveId?: string; from?: string; to?: string }) => {
      const params = new URLSearchParams(opts as any)
      return apiFetch<any>(`/accounts/${accountId}/campaigns?${params}`)
    },
    attribution: (accountId: string, campaignId: string, from?: string, to?: string) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      return apiFetch<CampaignAttributionResponse>(
        `/accounts/${accountId}/campaigns/${campaignId}/attribution?${params}`
      )
    },
  },

  demo: {
    startSession: () => apiFetch<{ accessToken: string; demoAccountId: string }>('/auth/demo', {
      method: 'POST',
    }),
  },
}
