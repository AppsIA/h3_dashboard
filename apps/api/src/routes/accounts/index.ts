import type { FastifyInstance } from 'fastify'
import { authenticate }        from '../../middleware/authenticate.js'
import { requireAccountAccess } from '../../middleware/tenant-scope.js'
import { calculateRoas }       from '@h3/domain'
import type { OverviewResponse } from '@h3/shared'

const ROAS_CACHE_TTL_RECENT  = 15 * 60        // 15 min para dados recentes
const ROAS_CACHE_TTL_HISTORY = 24 * 60 * 60  // 24h para histórico

export async function accountRoutes(app: FastifyInstance) {

  // ─── GET /accounts ────────────────────────────────────────────────────────
  // H3 staff: todas as contas. Cliente: apenas as suas.

  app.get('/', {
    preHandler: [authenticate],
    handler: async (req) => {
      if (req.user.isH3Staff) {
        const { data } = await app.supabaseAdmin
          .from('accounts')
          .select('*')
          .eq('is_active', true)
          .order('name')
        return data ?? []
      }

      const { data } = await app.supabaseAdmin
        .from('user_account_access')
        .select('accounts(*)')
        .eq('user_id', req.user.id)
      return (data ?? []).map((r: any) => r.accounts).filter(Boolean)
    },
  })

  // ─── GET /accounts/:accountId ─────────────────────────────────────────────

  app.get<{ Params: { accountId: string } }>('/:accountId', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { data, error } = await app.supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('id', req.params.accountId)
        .single()

      if (error || !data) return reply.status(404).send({ error: 'Conta não encontrada' })
      return data
    },
  })

  // ─── GET /accounts/:accountId/overview ───────────────────────────────────
  // Home View: ROAS herói, totais, breakdown por Objetivo

  app.get<{
    Params: { accountId: string }
    Querystring: { from?: string; to?: string }
  }>('/:accountId/overview', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { accountId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!

      // Cache Redis
      const cacheKey = `overview:${accountId}:${from}:${to}`
      const cached = await app.redis.get(cacheKey)
      if (cached) return JSON.parse(cached)

      // Conta e config
      const { data: account } = await app.supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single()
      if (!account) return reply.status(404).send({ error: 'Conta não encontrada' })

      // Spend total (via MV)
      const { data: spendData } = await app.supabaseAdmin
        .rpc('get_account_spend', { p_account_id: accountId, p_from: from, p_to: to })
      const totalSpend = Number(spendData ?? 0)

      // Receita (first_sale é o caso mais comum; o dispatcher cuida dos outros)
      const { data: revenueData } = await app.supabaseAdmin
        .rpc('get_account_revenue_first_sale', {
          p_account_id: accountId,
          p_from: from,
          p_to: to,
          p_attribution_window: account.attribution_window_days,
        })
      const revenue    = revenueData?.[0] ?? { total_revenue: 0, sales_count: 0 }
      const totalRevenue = Number(revenue.total_revenue)
      const salesCount   = Number(revenue.sales_count)

      // Leads no período
      const { count: totalLeads } = await app.supabaseAdmin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .gte('first_contact_at', from)
        .lte('first_contact_at', to + 'T23:59:59')

      // Cálculo de ROAS via domain
      const roasResult = calculateRoas({
        revenueModel: account.revenue_model,
        totalSpend,
        totalRevenue,
        salesCount,
        attributionWindowDays: account.attribution_window_days,
        cohortAvgMonths: account.cohort_avg_months ?? undefined,
        cohortMargin: account.cohort_margin ?? undefined,
        periodFrom: new Date(from),
        periodTo: new Date(to),
      })

      // Breakdown por Objetivo
      const { data: objectivesData } = await app.supabaseAdmin
        .from('mv_objective_daily')
        .select('objective_id, total_spend, total_impressions, total_clicks')
        .eq('account_id', accountId)
        .gte('metric_date', from)
        .lte('metric_date', to)

      const objectiveSpend = (objectivesData ?? []).reduce((acc: Record<string, number>, row: any) => {
        acc[row.objective_id] = (acc[row.objective_id] ?? 0) + Number(row.total_spend)
        return acc
      }, {})

      const { data: objectives } = await app.supabaseAdmin
        .from('objectives')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)

      const byObjective = (objectives ?? []).map((obj: any) => ({
        objectiveId: obj.id,
        type: obj.type,
        name: obj.name,
        spend: objectiveSpend[obj.id] ?? 0,
        primaryMetric: { label: obj.type === 'captacao' ? 'CPL' : 'CPM', value: 0 },
        attributedRevenue: 0,
        attributedRoas: 0,
        campaignCount: 0,
      }))

      // Trend (spend diário via MV)
      const { data: trend } = await app.supabaseAdmin
        .from('mv_account_daily')
        .select('metric_date, total_spend')
        .eq('account_id', accountId)
        .gte('metric_date', from)
        .lte('metric_date', to)
        .order('metric_date')

      const response: OverviewResponse = {
        accountId,
        accountName: account.name,
        isDemo: account.is_demo,
        period: { from, to },
        heroRoas: roasResult.roas as any,
        totals: {
          ...roasResult.totals,
          totalLeads: totalLeads ?? 0,
          conversionRateLeadToSale: totalLeads ? salesCount / totalLeads : 0,
        },
        byObjective,
        spendTrend: (trend ?? []).map((r: any) => ({
          date: r.metric_date,
          spend: Number(r.total_spend),
          revenue: 0,  // revenue por dia calculado separadamente sob demanda
        })),
      }

      // Cache TTL: recente = 15min, histórico = 24h
      const isRecent = new Date(to) >= new Date(Date.now() - 7 * 86400_000)
      await app.redis.setex(cacheKey, isRecent ? ROAS_CACHE_TTL_RECENT : ROAS_CACHE_TTL_HISTORY, JSON.stringify(response))

      return response
    },
  })

  // ─── GET /accounts/:accountId/roas ───────────────────────────────────────
  // Série temporal de ROAS com granularidade

  app.get<{
    Params: { accountId: string }
    Querystring: { from?: string; to?: string; granularity?: 'daily' | 'weekly' | 'monthly' }
  }>('/:accountId/roas', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { accountId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!
      const granularity = req.query.granularity ?? 'daily'

      const cacheKey = `roas:${accountId}:${from}:${to}:${granularity}`
      const cached = await app.redis.get(cacheKey)
      if (cached) return JSON.parse(cached)

      const { data: account } = await app.supabaseAdmin
        .from('accounts')
        .select('revenue_model, attribution_window_days, cohort_avg_months, cohort_margin')
        .eq('id', accountId)
        .single()
      if (!account) return reply.status(404).send({ error: 'Conta não encontrada' })

      const { data: spendRows } = await app.supabaseAdmin
        .from('mv_account_daily')
        .select('metric_date, total_spend')
        .eq('account_id', accountId)
        .gte('metric_date', from)
        .lte('metric_date', to)
        .order('metric_date')

      const { data: revenueData } = await app.supabaseAdmin
        .rpc('get_account_revenue_first_sale', {
          p_account_id: accountId,
          p_from: from,
          p_to: to,
          p_attribution_window: account.attribution_window_days,
        })
      const revenue    = revenueData?.[0] ?? { total_revenue: 0, sales_count: 0 }
      const totalSpend   = (spendRows ?? []).reduce((s: number, r: any) => s + Number(r.total_spend), 0)
      const totalRevenue = Number(revenue.total_revenue)
      const salesCount   = Number(revenue.sales_count)

      const roasResult = calculateRoas({
        revenueModel: account.revenue_model,
        totalSpend,
        totalRevenue,
        salesCount,
        attributionWindowDays: account.attribution_window_days,
        cohortAvgMonths: account.cohort_avg_months ?? undefined,
        cohortMargin: account.cohort_margin ?? undefined,
        periodFrom: new Date(from),
        periodTo: new Date(to),
      })

      const response = {
        accountId,
        period: { from, to },
        roas: roasResult.roas,
        totals: roasResult.totals,
        series: (spendRows ?? []).map((r: any) => ({
          date: r.metric_date,
          spend: Number(r.total_spend),
          revenue: 0,
          roas: 0,
        })),
      }

      await app.redis.setex(cacheKey, ROAS_CACHE_TTL_RECENT, JSON.stringify(response))
      return response
    },
  })
}
