import type { FastifyRequest, FastifyReply } from 'fastify'

export interface AuthUser {
  id: string
  email: string
  role: 'h3_admin' | 'h3_analyst' | 'client'
  isH3Staff: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser
  }
}

/**
 * Valida o JWT do Supabase Auth no header Authorization.
 * Popula req.user com id, email e role do perfil.
 */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token ausente' })
  }

  const token = authHeader.slice(7)

  try {
    const { data: { user }, error } = await req.server.supabase.auth.getUser(token)

    if (error || !user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido' })
    }

    // Busca role do perfil
    const { data: profile } = await req.server.supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Usuário inativo' })
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: profile.role,
      isH3Staff: ['h3_admin', 'h3_analyst'].includes(profile.role),
    }
  } catch {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Falha na autenticação' })
  }
}
