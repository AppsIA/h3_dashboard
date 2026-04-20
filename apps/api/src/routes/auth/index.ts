import type { FastifyInstance } from 'fastify'

export async function authRoutes(app: FastifyInstance) {

  // ─── POST /auth/sso/google/callback ──────────────────────────────────────
  // OAuth callback (Supabase Auth lida com isso automaticamente via redirect)
  // Este endpoint é apenas um helper redirect para o frontend
  app.get('/sso/:provider/callback', async (req, reply) => {
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'
    return reply.redirect(`${webUrl}/auth/callback${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`)
  })

  // ─── POST /auth/demo ─────────────────────────────────────────────────────
  // Cria sessão anonima para acesso à conta demo (pitches)
  app.post('/demo', async (req, reply) => {
    const { data, error } = await app.supabase.auth.signInAnonymously()
    if (error) return reply.status(500).send({ error: 'Falha ao criar sessão demo' })

    // Busca conta demo
    const { data: demoAccount } = await app.supabaseAdmin
      .from('accounts')
      .select('id, name')
      .eq('is_demo', true)
      .eq('is_active', true)
      .limit(1)
      .single()

    return {
      accessToken: data.session?.access_token,
      demoAccountId: demoAccount?.id,
      expiresIn: 14400,  // 4h
    }
  })

  // ─── GET /auth/me ─────────────────────────────────────────────────────────
  app.get('/me', async (req, reply) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    const { data: { user }, error } = await app.supabase.auth.getUser(authHeader.slice(7))
    if (error || !user) return reply.status(401).send({ error: 'Unauthorized' })

    const { data: profile } = await app.supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { user: { id: user.id, email: user.email }, profile }
  })
}
