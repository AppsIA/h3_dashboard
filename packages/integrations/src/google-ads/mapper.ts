import { createHash } from 'node:crypto'
import type { GoogleAdRow } from './client.js'
import type { NormalizedAdMetric } from '../meta-ads/mapper.js'

export function mapGoogleRow(row: GoogleAdRow): NormalizedAdMetric {
  const spendBrl = parseInt(row.metrics.costMicros ?? '0', 10) / 1_000_000

  const raw = JSON.stringify(row)
  const sourceChecksum = createHash('sha256').update(raw).digest('hex').slice(0, 64)

  return {
    platform: 'google' as const,
    platformCampaignId: row.campaign.id,
    platformAdSetId: row.adGroup.id,
    platformCreativeId: row.ad.id,
    metricDate: row.segments.date,
    spend: spendBrl,
    impressions: parseInt(row.metrics.impressions ?? '0', 10),
    clicks: parseInt(row.metrics.clicks ?? '0', 10),
    platformConversions: Math.round(parseFloat(row.metrics.conversions ?? '0')),
    platformConversionValue: parseFloat(row.metrics.conversionsValue ?? '0'),
    sourceChecksum,
  }
}
