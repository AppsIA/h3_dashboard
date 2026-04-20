import { Queue, Worker, type Job } from 'bullmq'
import type Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { fetchMetaInsights, mapMetaInsight }    from '@h3/integrations'
import { fetchGoogleInsights, mapGoogleRow }    from '@h3/integrations'
import type { NormalizedAdMetric }              from '@h3/integrations'
import { logger }                               from '../logger.js'

export interface AdsSyncJobData {
  accountId: string
  platform: 'meta' | 'google'
  adAccountId: string     // ID da conta na plataforma
  accessToken: string
  developerToken?: string // Google only
  dateStart: string
  dateEnd: string
  jobType: 'daily_sync' | 'backfill' | 'incremental'
  ingestionJobId?: string
}

const QUEUE_NAME = 'h3:ads-sync'

export function createAdsSyncQueue(redis: Redis): Queue<AdsSyncJobData> {
  return new Queue<AdsSyncJobData>(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  })
}

export function createAdsSyncWorker(redis: Redis): Worker<AdsSyncJobData> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  return new Worker<AdsSyncJobData>(
    QUEUE_NAME,
    async (job: Job<AdsSyncJobData>) => {
      const { accountId, platform, adAccountId, accessToken, developerToken, dateStart, dateEnd, ingestionJobId } = job.data

      logger.info({ accountId, platform, dateStart, dateEnd }, 'Iniciando sync de Ads')

      // Marca job como running
      if (ingestionJobId) {
        await supabase.from('ingestion_jobs').update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', ingestionJobId)
      }

      let metrics: NormalizedAdMetric[] = []

      try {
        if (platform === 'meta') {
          const insights = await fetchMetaInsights(
            { adAccountId, dateStart, dateStop: dateEnd, level: 'ad' },
            accessToken
          )
          metrics = insights.map(mapMetaInsight)
        } else if (platform === 'google') {
          const rows = await fetchGoogleInsights({
            customerId: adAccountId,
            dateStart,
            dateStop: dateEnd,
            accessToken,
            developerToken: developerToken!,
          })
          metrics = rows.map(mapGoogleRow)
        }

        // Resolve campaign_id pelo platform_campaign_id
        const platformCampaignIds = [...new Set(metrics.map(m => m.platformCampaignId))]
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, platform_campaign_id')
          .eq('account_id', accountId)
          .in('platform_campaign_id', platformCampaignIds)

        const campaignMap = Object.fromEntries(
          (campaigns ?? []).map((c: any) => [c.platform_campaign_id, c.id])
        )

        let processed = 0
        let failed = 0

        for (const metric of metrics) {
          const campaignId = campaignMap[metric.platformCampaignId]
          if (!campaignId) { failed++; continue }

          const { error } = await supabase.rpc('upsert_ad_metric', {
            p_account_id:          accountId,
            p_campaign_id:         campaignId,
            p_ad_set_id:           null,
            p_creative_id:         null,
            p_platform:            metric.platform,
            p_metric_date:         metric.metricDate,
            p_spend:               metric.spend,
            p_impressions:         metric.impressions,
            p_clicks:              metric.clicks,
            p_platform_conversions: metric.platformConversions,
            p_platform_conversion_value: metric.platformConversionValue,
            p_source_checksum:     metric.sourceChecksum,
          })

          if (error) { failed++; logger.error({ error }, 'Erro ao upsert métrica') }
          else processed++
        }

        // Atualiza job
        if (ingestionJobId) {
          await supabase.from('ingestion_jobs').update({
            status: failed === metrics.length ? 'failed' : failed > 0 ? 'partial' : 'completed',
            records_fetched: metrics.length,
            records_processed: processed,
            records_failed: failed,
            completed_at: new Date().toISOString(),
          }).eq('id', ingestionJobId)
        }

        logger.info({ accountId, platform, processed, failed }, 'Sync de Ads concluído')

      } catch (err: any) {
        if (ingestionJobId) {
          await supabase.from('ingestion_jobs').update({
            status: 'failed',
            last_error: err.message,
            retry_count: job.attemptsMade,
          }).eq('id', ingestionJobId)
        }
        throw err
      }
    },
    {
      connection: redis,
      concurrency: 3,  // 3 jobs paralelos por worker
    }
  )
}
