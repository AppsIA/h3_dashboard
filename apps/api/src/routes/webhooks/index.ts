import type { FastifyInstance } from 'fastify'
import { validateCrmWebhookSignature } from '@h3/integrations'
import { hashPhone, hashWhatsapp, encryptPii } from '@h3/shared'
import type { CrmWebhookPayload } from '@h3/shared'

export async function webhookRoutes(app: FastifyInstance) {

  // ─── POST /webhooks/crm ──────────────────────────────────────────────────
  // Recebe push de Lead/Venda do H3 CRM.
  // Processamento assíncrono: valida, enfileira, responde 200 imediatamente.

  app.post<{ Body: CrmWebhookPayload }>('/crm', {
    config: { rawBody: true },  // necessário para validar HMAC
    handler: async (req, reply) => {
      // Valida assinatura HMAC
      const signature = req.headers['x-h3-signature'] as string ?? ''
      const rawBody   = (req as any).rawBody as string ?? JSON.stringify(req.body)

      if (!validateCrmWebhookSignature(rawBody, signature)) {
        req.log.warn({ event: req.body.event }, 'Webhook CRM com assinatura inválida')
        return reply.status(401).send({ error: 'Assinatura inválida' })
      }

      const { event, accountCrmId, data } = req.body

      // Busca account pelo crm_account_id
      const { data: account } = await app.supabaseAdmin
        .from('accounts')
        .select('id, attribution_window_days')
        .eq('crm_account_id', accountCrmId)
        .single()

      if (!account) {
        req.log.warn({ accountCrmId }, 'Webhook CRM: account não encontrada')
        return reply.status(200).send({ accepted: false, reason: 'account not mapped' })
      }

      if (event === 'lead.updated') {
        await processLeadUpsert(app, account.id, data as any)
      } else if (event === 'sale.confirmed' || event === 'sale.refunded') {
        await processSaleUpsert(app, account.id, event, data as any)
        // Invalida cache de ROAS da conta
        const keys = await app.redis.keys(`roas:${account.id}:*`)
        if (keys.length) await app.redis.del(...keys)
        const okeys = await app.redis.keys(`overview:${account.id}:*`)
        if (okeys.length) await app.redis.del(...okeys)
      }

      req.log.info({ event, accountId: account.id }, 'Webhook CRM processado')
      return reply.status(200).send({ accepted: true })
    },
  })
}

async function processLeadUpsert(app: FastifyInstance, accountId: string, lead: any) {
  const nameEnc  = lead.name  ? encryptPii(lead.name)  : null
  const emailEnc = lead.email ? encryptPii(lead.email) : null
  const phoneHash = lead.phone      ? hashPhone(lead.phone) : null
  const waHash    = lead.whatsapp_number ? hashWhatsapp(lead.whatsapp_number) : null

  // Tenta encontrar a campanha pelo utm_campaign
  let campaignId: string | null = null
  if (lead.utm_campaign) {
    const { data: camp } = await app.supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('account_id', accountId)
      .ilike('name', `%${lead.utm_campaign}%`)
      .limit(1)
      .single()
    campaignId = camp?.id ?? null
  }

  await app.supabaseAdmin.from('leads').upsert({
    account_id:   accountId,
    crm_lead_id:  lead.id,
    campaign_id:  campaignId,
    utm_source:   lead.utm_source   ?? null,
    utm_medium:   lead.utm_medium   ?? null,
    utm_campaign: lead.utm_campaign ?? null,
    utm_content:  lead.utm_content  ?? null,
    utm_term:     lead.utm_term     ?? null,
    entry_point:  lead.entry_point  ?? null,
    whatsapp_number_hash: waHash,
    status:       lead.status,
    name_enc:     nameEnc,
    email_enc:    emailEnc,
    phone_hash:   phoneHash,
    first_contact_at: lead.first_contact_at,
    qualified_at: lead.qualified_at ?? null,
  }, { onConflict: 'account_id,crm_lead_id' })
}

async function processSaleUpsert(app: FastifyInstance, accountId: string, event: string, sale: any) {
  // Busca lead pelo crm_lead_id
  const { data: lead } = await app.supabaseAdmin
    .from('leads')
    .select('id, campaign_id, ad_set_id, creative_id')
    .eq('account_id', accountId)
    .eq('crm_lead_id', sale.lead_id)
    .single()

  if (!lead) return

  await app.supabaseAdmin.from('sales').upsert({
    account_id:   accountId,
    lead_id:      lead.id,
    crm_sale_id:  sale.id,
    campaign_id:  lead.campaign_id,
    ad_set_id:    lead.ad_set_id,
    creative_id:  lead.creative_id,
    amount:       sale.amount,
    currency:     sale.currency ?? 'BRL',
    is_recurring: sale.is_recurring ?? false,
    subscription_month: sale.subscription_month ?? null,
    status:       event === 'sale.refunded' ? 'refunded' : 'confirmed',
    confirmed_at: sale.confirmed_at,
  }, { onConflict: 'account_id,crm_sale_id' })
}
