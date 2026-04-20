import { Queue, Worker, type Job } from 'bullmq'
import type Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { fetchLeadsIncremental, fetchSalesIncremental } from '@h3/integrations'
import { encryptPii, hashPhone, hashWhatsapp }          from '@h3/shared'
import { logger }                                        from '../logger.js'

export interface CrmSyncJobData {
  accountId: string
  crmAccountId: string
  updatedAfter: string  // ISO date
}

const QUEUE_NAME = 'h3:crm-sync'

export function createCrmSyncQueue(redis: Redis): Queue<CrmSyncJobData> {
  return new Queue<CrmSyncJobData>(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  })
}

export function createCrmSyncWorker(redis: Redis): Worker<CrmSyncJobData> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  return new Worker<CrmSyncJobData>(
    QUEUE_NAME,
    async (job: Job<CrmSyncJobData>) => {
      const { accountId, crmAccountId, updatedAfter } = job.data
      const since = new Date(updatedAfter)

      logger.info({ accountId, crmAccountId, updatedAfter }, 'CRM sync iniciado')

      // Leads
      const leads = await fetchLeadsIncremental(crmAccountId, since)
      for (const lead of leads) {
        await supabase.from('leads').upsert({
          account_id:   accountId,
          crm_lead_id:  lead.id,
          utm_source:   lead.utm_source   ?? null,
          utm_medium:   lead.utm_medium   ?? null,
          utm_campaign: lead.utm_campaign ?? null,
          utm_content:  lead.utm_content  ?? null,
          utm_term:     lead.utm_term     ?? null,
          entry_point:  lead.entry_point  ?? null,
          whatsapp_number_hash: lead.whatsapp_number ? hashWhatsapp(lead.whatsapp_number) : null,
          status:       lead.status,
          name_enc:     lead.name  ? encryptPii(lead.name)  : null,
          email_enc:    lead.email ? encryptPii(lead.email) : null,
          phone_hash:   lead.phone ? hashPhone(lead.phone)  : null,
          first_contact_at: lead.first_contact_at,
          qualified_at:     lead.qualified_at ?? null,
        }, { onConflict: 'account_id,crm_lead_id' })
      }

      // Sales
      const sales = await fetchSalesIncremental(crmAccountId, since)
      for (const sale of sales) {
        const { data: lead } = await supabase
          .from('leads')
          .select('id, campaign_id, ad_set_id, creative_id')
          .eq('account_id', accountId)
          .eq('crm_lead_id', sale.lead_id)
          .single()

        if (!lead) continue

        await supabase.from('sales').upsert({
          account_id:   accountId,
          lead_id:      lead.id,
          crm_sale_id:  sale.id,
          campaign_id:  lead.campaign_id,
          amount:       sale.amount,
          currency:     sale.currency ?? 'BRL',
          is_recurring: sale.is_recurring,
          subscription_month: sale.subscription_month ?? null,
          status:       sale.status,
          confirmed_at: sale.confirmed_at,
        }, { onConflict: 'account_id,crm_sale_id' })
      }

      logger.info({ accountId, leads: leads.length, sales: sales.length }, 'CRM sync concluído')
    },
    { connection: redis, concurrency: 5 }
  )
}
