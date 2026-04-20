import type { FastifyInstance } from 'fastify'

// Rota interna: acessível apenas com token de serviço (SUPABASE_SERVICE_ROLE_KEY)
function requireServiceToken(app: FastifyInstance) {
  return async (req: any, reply: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return reply.status(403).send({ error: 'Acesso restrito' })
    }
  }
}

export async function internalRoutes(app: FastifyInstance) {
  const guard = requireServiceToken(app)

  app.get('/health', async () => ({
    status: 'ok',
    supabase: 'connected',
    redis: 'connected',
    ts: new Date().toISOString(),
  }))

  // Dispara sync manual de uma conta
  app.post<{ Body: { accountId: string; platform: string; dateStart: string; dateEnd: string } }>(
    '/ingestion/trigger',
    { preHandler: [guard] },
    async (req, reply) => {
      const { accountId, platform, dateStart, dateEnd } = req.body

      const { data: job } = await app.supabaseAdmin
        .from('ingestion_jobs')
        .insert({
          account_id: accountId,
          platform,
          job_type: 'daily_sync',
          date_start: dateStart,
          date_end: dateEnd,
          status: 'pending',
        })
        .select()
        .single()

      return { jobId: job?.id, status: 'enqueued' }
    }
  )

  // Status dos últimos jobs
  app.get<{ Querystring: { accountId?: string; status?: string; limit?: string } }>(
    '/ingestion/jobs',
    { preHandler: [guard] },
    async (req) => {
      let query = app.supabaseAdmin
        .from('ingestion_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(req.query.limit ?? '50', 10))

      if (req.query.accountId) query = query.eq('account_id', req.query.accountId)
      if (req.query.status)    query = query.eq('status', req.query.status)

      const { data } = await query
      return data ?? []
    }
  )
}
