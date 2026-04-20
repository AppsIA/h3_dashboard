import type { FastifyRequest } from 'fastify'

/**
 * Registra acesso a dados sensíveis na tabela audit_log.
 * Chame em rotas que expõem PII (leads, dados de clientes).
 */
export async function logAudit(
  req: FastifyRequest,
  action: string,
  resourceType?: string,
  resourceId?: string
) {
  const { accountId } = (req.params as Record<string, string>) ?? {}

  await req.server.supabaseAdmin.from('audit_log').insert({
    user_id:       req.user?.id ?? null,
    account_id:    accountId ?? null,
    action,
    resource_type: resourceType ?? null,
    resource_id:   resourceId ?? null,
    ip_address:    req.ip,
    user_agent:    req.headers['user-agent'] ?? null,
    metadata: {
      method: req.method,
      url: req.url,
      requestId: req.id,
    },
  })
}
