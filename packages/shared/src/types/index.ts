// ─────────────────────────────────────────────────────────────────────────────
// Tipos compartilhados entre API, Workers e Web
// Gerado base: manutenção manual + `pnpm db:types` complementa com tipos Supabase
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueModel  = 'first_sale' | 'cohort_ltv' | 'multi_product'
export type ObjectiveType = 'captacao' | 'venda_direta' | 'alcance' | 'seguidores'
export type AdPlatform    = 'meta' | 'google' | 'tiktok' | 'instagram_organic'
export type LeadStatus    = 'novo' | 'qualificado' | 'negociacao' | 'ganho' | 'perdido'
export type SaleStatus    = 'confirmed' | 'refunded' | 'chargeback'
export type UserRole      = 'h3_admin' | 'h3_analyst' | 'client'
export type AccountRole   = 'viewer' | 'analyst' | 'admin'

// ─────────────────────────────────────────────────────────────────────────────
// Account
// ─────────────────────────────────────────────────────────────────────────────

export interface Account {
  id: string
  organizationId: string
  name: string
  slug: string
  revenueModel: RevenueModel
  attributionWindowDays: number
  cohortAvgMonths?: number
  cohortMargin?: number
  isDemo: boolean
  isInternal: boolean
  crmAccountId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ROAS Response (contrato da API — imutável)
// ─────────────────────────────────────────────────────────────────────────────

export interface RoasMetadataDto {
  value: number
  method: RevenueModel
  source: 'H3 CRM'
  formulaLabel: string            // "ROAS first_sale · janela 30d · fonte: H3 CRM"
  attributionWindowDays?: number
  cohortAvgMonths?: number
  cohortMargin?: number
  isStable?: boolean
  expectedStableAt?: string
}

export interface RoasTotalsDto {
  totalSpend: number
  totalRevenue: number
  salesCount: number
  currency: 'BRL'
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview (Home View)
// ─────────────────────────────────────────────────────────────────────────────

export interface OverviewByObjective {
  objectiveId: string
  type: ObjectiveType
  name: string
  spend: number
  primaryMetric: { label: string; value: number }  // CPL, CPM, etc.
  attributedRevenue: number
  attributedRoas: number
  campaignCount: number
}

export interface OverviewResponse {
  accountId: string
  accountName: string
  isDemo: boolean
  period: { from: string; to: string }
  heroRoas: RoasMetadataDto
  totals: RoasTotalsDto & {
    totalLeads: number
    conversionRateLeadToSale: number
  }
  byObjective: OverviewByObjective[]
  spendTrend: Array<{ date: string; spend: number; revenue: number }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Attribution (cross-objetivo)
// ─────────────────────────────────────────────────────────────────────────────

export interface CampaignFunnel {
  impressions: number
  clicks: number
  leads: number
  leadsQualified: number
  sales: number
  conversionClickToLead: number
  conversionLeadToSale: number
}

export interface CampaignAttributionResponse {
  campaignId: string
  campaignName: string
  declaredObjective: { type: ObjectiveType; name: string }
  platform: AdPlatform
  period: { from: string; to: string }
  primaryMetrics: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpm: number
    leads: number
    cpl: number
  }
  attributedRevenue: RoasTotalsDto & { roas: number } & RoasMetadataDto
  funnel: CampaignFunnel
  topCreatives: Array<{
    creativeId: string
    name: string
    spend: number
    attributedRevenue: number
    roas: number
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook do CRM
// ─────────────────────────────────────────────────────────────────────────────

export type CrmWebhookEvent = 'lead.updated' | 'sale.confirmed' | 'sale.refunded'

export interface CrmWebhookPayload {
  event: CrmWebhookEvent
  accountCrmId: string
  timestamp: string
  data: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number
  error: string
  message: string
  requestId?: string
}
