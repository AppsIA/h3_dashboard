import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Valida que o accountId no path pertence ao usuário autenticado.
 * H3 staff (h3_admin, h3_analyst) têm acesso a todas as contas.
 * Cliente tem acesso apenas às contas em user_account_access.
 *
 * Deve ser chamado APÓS authenticate().
 * Requer que a rota tenha :accountId no path.
 */
export async function requireAccountAccess(req: FastifyRequest, reply: FastifyReply) {
  const { accountId } = req.params as { accountId: string }
  if (!accountId) return  // rota sem accountId — pular

  // H3 staff acessa tudo
  if (req.user.isH3Staff) return

  // Cliente: verifica acesso
  const { data, error } = await req.server.supabaseAdmin
    .from('user_account_access')
    .select('account_id')
    .eq('user_id', req.user.id)
    .eq('account_id', accountId)
    .single()

  if (error || !data) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Acesso negado a esta conta',
    })
  }
}
