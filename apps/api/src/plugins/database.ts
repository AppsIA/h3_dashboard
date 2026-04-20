import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    supabase: ReturnType<typeof createClient>
    supabaseAdmin: ReturnType<typeof createClient>
  }
}

export const databasePlugin = fp(async (app: FastifyInstance) => {
  const url     = process.env.SUPABASE_URL!
  const anon    = process.env.SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!url || !anon || !service) {
    throw new Error('Variáveis SUPABASE_* obrigatórias não configuradas')
  }

  // Cliente público — usa RLS (para queries autenticadas via JWT do usuário)
  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
  })

  // Cliente admin — bypassa RLS (para workers e operações internas)
  const supabaseAdmin = createClient(url, service, {
    auth: { persistSession: false },
  })

  app.decorate('supabase', supabase)
  app.decorate('supabaseAdmin', supabaseAdmin)

  app.log.info('Supabase conectado')
})
