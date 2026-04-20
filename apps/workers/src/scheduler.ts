import { createClient } from '@supabase/supabase-js'
import type { Queue } from 'bullmq'
import type { AdsSyncJobData } from './queues/ads-sync.queue.js'
import type { CrmSyncJobData } from './queues/crm-sync.queue.js'
import { logger } from './logger.js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * Dispara sync de Ads para todas as contas ativas.
 * Chamado pelo scheduler a cada 6h.
 */
export async function scheduleAdsSyncForAllAccounts(
  adsQueue: Queue<AdsSyncJobData>
) {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, crm_account_id, is_demo')
    .eq('is_active', true)
    .eq('is_demo', false)   // não sincroniza conta demo

  if (!accounts?.length) return

  const today = new Date().toISOString().split('T')[0]!
  const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0]!
  const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString().split('T')[0]!

  for (const account of accounts) {
    // Meta
    if (process.env.META_ACCESS_TOKEN) {
      await adsQueue.add(`meta-${account.id}-${today}`, {
        accountId: account.id,
        platform: 'meta',
        adAccountId: process.env.META_AD_ACCOUNT_ID ?? '',
        accessToken: process.env.META_ACCESS_TOKEN,
        dateStart: twoDaysAgo,
        dateEnd: today,
        jobType: 'daily_sync',
      }, { priority: 5, delay: Math.random() * 30_000 })  // jitter para distribuir requests
    }

    // Google
    if (process.env.GOOGLE_ADS_REFRESH_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID) {
      await adsQueue.add(`google-${account.id}-${today}`, {
        accountId: account.id,
        platform: 'google',
        adAccountId: process.env.GOOGLE_ADS_CUSTOMER_ID,
        accessToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        dateStart: twoDaysAgo,
        dateEnd: today,
        jobType: 'daily_sync',
      }, { priority: 5, delay: Math.random() * 60_000 })
    }
  }

  logger.info({ accounts: accounts.length }, 'Ads sync agendado para todas as contas')
}

/**
 * Polling incremental do CRM para todas as contas ativas.
 * Chamado a cada 2 minutos.
 */
export async function scheduleCrmPollForAllAccounts(
  crmQueue: Queue<CrmSyncJobData>,
  lastPollAt: Date
) {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, crm_account_id')
    .eq('is_active', true)
    .eq('is_demo', false)
    .not('crm_account_id', 'is', null)

  if (!accounts?.length) return

  for (const account of accounts) {
    await crmQueue.add(`crm-${account.id}`, {
      accountId: account.id,
      crmAccountId: account.crm_account_id,
      updatedAfter: lastPollAt.toISOString(),
    }, {
      priority: 1,   // alta prioridade (near-real-time SLA)
      removeOnComplete: true,
    })
  }
}
