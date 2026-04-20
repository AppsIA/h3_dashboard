import { createHash } from 'node:crypto'
import type { MetaAdInsight } from './client.js'

export interface NormalizedAdMetric {
  platform: 'meta'
  platformCampaignId: string
  platformAdSetId: string
  platformCreativeId: string
  metricDate: string
  spend: number
  impressions: number
  clicks: number
  platformConversions: number
  platformConversionValue: number
  sourceChecksum: string
}

export function mapMetaInsight(insight: MetaAdInsight): NormalizedAdMetric {
  const conversions = (insight.actions ?? [])
    .filter(a => a.action_type === 'purchase' || a.action_type === 'lead')
    .reduce((sum, a) => sum + parseFloat(a.value), 0)

  const conversionValue = (insight.actions ?? [])
    .filter(a => a.action_type === 'purchase_roas' || a.action_type === 'offsite_conversion.fb_pixel_purchase')
    .reduce((sum, a) => sum + parseFloat(a.value), 0)

  const raw = JSON.stringify(insight)
  const sourceChecksum = createHash('sha256').update(raw).digest('hex').slice(0, 64)

  return {
    platform: 'meta',
    platformCampaignId: insight.campaign_id,
    platformAdSetId: insight.adset_id,
    platformCreativeId: insight.ad_id,
    metricDate: insight.date_start,
    spend: parseFloat(insight.spend ?? '0'),
    impressions: parseInt(insight.impressions ?? '0', 10),
    clicks: parseInt(insight.clicks ?? '0', 10),
    platformConversions: Math.round(conversions),
    platformConversionValue: conversionValue,
    sourceChecksum,
  }
}
