import type { FastifyInstance } from 'fastify'
import { authenticate }         from '../../middleware/authenticate.js'
import { requireAccountAccess } from '../../middleware/tenant-scope.js'

export async function objectiveRoutes(app: FastifyInstance) {

  app.get<{
    Params: { accountId: string }
    Querystring: { from?: string; to?: string }
  }>('/:accountId/objectives', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req) => {
      const { accountId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!

      const { data: objectives } = await app.supabaseAdmin
        .from('objectives')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('name')

      // Agrega spend por objetivo via MV
      const { data: spendRows } = await app.supabaseAdmin
        .from('mv_objective_daily')
        .select('objective_id, total_spend, total_clicks, total_impressions, campaign_count')
        .eq('account_id', accountId)
        .gte('metric_date', from)
        .lte('metric_date', to)

      const spendByObjective = (spendRows ?? []).reduce((acc: Record<string, any>, row: any) => {
        if (!acc[row.objective_id]) {
          acc[row.objective_id] = { spend: 0, clicks: 0, impressions: 0, campaigns: new Set<string>() }
        }
        acc[row.objective_id].spend       += Number(row.total_spend)
        acc[row.objective_id].clicks      += Number(row.total_clicks)
        acc[row.objective_id].impressions += Number(row.total_impressions)
        return acc
      }, {})

      return (objectives ?? []).map((obj: any) => {
        const metrics = spendByObjective[obj.id] ?? { spend: 0, clicks: 0, impressions: 0 }
        return {
          ...obj,
          metrics: {
            spend: metrics.spend,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            ctr: metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0,
          },
        }
      })
    },
  })

  app.get<{
    Params: { accountId: string; objectiveId: string }
    Querystring: { from?: string; to?: string }
  }>('/:accountId/objectives/:objectiveId/metrics', {
    preHandler: [authenticate, requireAccountAccess],
    handler: async (req, reply) => {
      const { accountId, objectiveId } = req.params
      const to   = req.query.to   ?? new Date().toISOString().split('T')[0]!
      const from = req.query.from ?? new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]!

      const { data: objective } = await app.supabaseAdmin
        .from('objectives')
        .select('*')
        .eq('id', objectiveId)
        .eq('account_id', accountId)
        .single()

      if (!objective) return reply.status(404).send({ error: 'Objetivo não encontrado' })

      // Campanhas deste objetivo com métricas
      const { data: campaigns } = await app.supabaseAdmin
        .from('campaigns')
        .select('id, name, platform, status')
        .eq('objective_id', objectiveId)
        .eq('account_id', accountId)

      return { objective, campaigns: campaigns ?? [], period: { from, to } }
    },
  })
}
