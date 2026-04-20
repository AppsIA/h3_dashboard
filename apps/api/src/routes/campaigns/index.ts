import type { FastifyInstance } from 'fastify'
import { authenticate }         from '../../middleware/authenticate.js'
import { requireAccountAccess } from '../../middleware/tenant-scope.js'

export async function campaignRoutes(app: FastifyInstance) {

  // ─── GET /accounts/:accountId/campaigns ──────────────────────────────────

  app.get<{
    Params: { accountId: string }
    Querystring: { objectiveId?: string; from?: string; to?: string; page?: string; limit?: string }
  }>('/:accountId/campaigns', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req) => {
      const { accountId } = req.params
      const { objectiveId, from, to } = req.query
      const page  = parseInt(req.query.page ?? '1', 10)
      const limit = Math.min(parseInt(req.query.limit ?? '25', 10), 100)

      let query = app.supabaseAdmin
        .from('campaigns')
        .select('*, objectives(type, name)', { count: 'exact' })
        .eq('account_id', accountId)
        .range((page - 1) * limit, page * limit - 1)
        .order('name')

      if (objectiveId) query = query.eq('objective_id', objectiveId)

      const { data, count } = await query
      return { data: data ?? [], total: count ?? 0, page, limit }
    },
  })

  // ─── GET /accounts/:accountId/campaigns/:campaignId ──────────────────────

  app.get<{
    Params: { accountId: string; campaignId: string }
    Querystring: { from?: string; to?: string }
  }>('/:accountId/campaigns/:campaignId', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { accountId, campaignId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!

      const { data: campaign, error } = await app.supabaseAdmin
        .from('campaigns')
        .select('*, objectives(type, name)')
        .eq('id', campaignId)
        .eq('account_id', accountId)
        .single()

      if (error || !campaign) return reply.status(404).send({ error: 'Campanha não encontrada' })
      return campaign
    },
  })

  // ─── GET /accounts/:accountId/campaigns/:campaignId/attribution ──────────
  // Cross-objetivo: spend + funil + receita atribuída

  app.get<{
    Params: { accountId: string; campaignId: string }
    Querystring: { from?: string; to?: string }
  }>('/:accountId/campaigns/:campaignId/attribution', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { accountId, campaignId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!

      const cacheKey = `attribution:${campaignId}:${from}:${to}`
      const cached = await app.redis.get(cacheKey)
      if (cached) return JSON.parse(cached)

      // Campanha + objetivo
      const { data: campaign } = await app.supabaseAdmin
        .from('campaigns')
        .select('*, objectives(type, name)')
        .eq('id', campaignId)
        .eq('account_id', accountId)
        .single()
      if (!campaign) return reply.status(404).send({ error: 'Campanha não encontrada' })

      const { data: account } = await app.supabaseAdmin
        .from('accounts')
        .select('revenue_model, attribution_window_days')
        .eq('id', accountId)
        .single()

      // Funil via função SQL
      const { data: funnel } = await app.supabaseAdmin
        .rpc('get_campaign_funnel', { p_campaign_id: campaignId, p_from: from, p_to: to })
      const f = funnel?.[0] ?? {}

      // Receita atribuída (cross-objetivo)
      const { data: revenue } = await app.supabaseAdmin
        .rpc('get_campaign_attributed_revenue', {
          p_campaign_id: campaignId,
          p_from: from,
          p_to: to,
          p_attribution_window: account?.attribution_window_days ?? 30,
        })
      const r = revenue?.[0] ?? { total_revenue: 0, sales_count: 0 }

      const spend = Number(f.spend ?? 0)
      const clicks = Number(f.clicks ?? 0)
      const leads = Number(f.leads ?? 0)
      const totalRevenue = Number(r.total_revenue)
      const roas = spend > 0 ? parseFloat((totalRevenue / spend).toFixed(4)) : 0
      const window = account?.attribution_window_days ?? 30

      const response = {
        campaignId,
        campaignName: campaign.name,
        declaredObjective: (campaign as any).objectives,
        platform: campaign.platform,
        period: { from, to },
        primaryMetrics: {
          spend,
          impressions: Number(f.impressions ?? 0),
          clicks,
          ctr: clicks > 0 && Number(f.impressions) > 0 ? clicks / Number(f.impressions) : 0,
          cpm: Number(f.impressions) > 0 ? (spend / Number(f.impressions)) * 1000 : 0,
          leads,
          cpl: leads > 0 ? spend / leads : 0,
        },
        attributedRevenue: {
          total: totalRevenue,
          salesCount: Number(r.sales_count),
          roas,
          method: account?.revenue_model ?? 'first_sale',
          source: 'H3 CRM',
          attributionWindowDays: window,
          formulaLabel: `ROAS ${account?.revenue_model ?? 'first_sale'} · janela ${window}d · fonte: H3 CRM`,
        },
        funnel: {
          impressions: Number(f.impressions ?? 0),
          clicks,
          leads,
          leadsQualified: Number(f.leads_qualified ?? 0),
          sales: Number(f.sales ?? 0),
          conversionClickToLead: clicks > 0 ? leads / clicks : 0,
          conversionLeadToSale: leads > 0 ? Number(f.sales ?? 0) / leads : 0,
        },
        topCreatives: [],  // populado em endpoint separado quando necessário
      }

      await app.redis.setex(cacheKey, 15 * 60, JSON.stringify(response))
      return response
    },
  })
}
