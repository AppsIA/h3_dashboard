import ky from 'ky'

const GOOGLE_ADS_API_VERSION = 'v18'
const BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

export interface GoogleAdRow {
  campaign: {
    id: string
    name: string
    status: string
    advertisingChannelType: string
  }
  adGroup: { id: string; name: string }
  ad: { id: string; name?: string }
  metrics: {
    costMicros: string
    impressions: string
    clicks: string
    conversions: string
    conversionsValue: string
  }
  segments: { date: string }
}

function getGoogleHeaders(accessToken: string, developerToken: string, customerId: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'login-customer-id': customerId,
  }
}

export async function fetchGoogleInsights(params: {
  customerId: string
  dateStart: string
  dateStop: string
  accessToken: string
  developerToken: string
}): Promise<GoogleAdRow[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      segments.date
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${params.dateStart}' AND '${params.dateStop}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date
    LIMIT 10000
  `

  const cleanCustomerId = params.customerId.replace(/-/g, '')
  const response = await ky
    .post(`${BASE_URL}/customers/${cleanCustomerId}/googleAds:searchStream`, {
      headers: getGoogleHeaders(params.accessToken, params.developerToken, cleanCustomerId),
      json: { query },
      retry: { limit: 3 },
      timeout: 60_000,
    })
    .json<{ results: GoogleAdRow[] }[]>()

  return response.flatMap(r => r.results ?? [])
}
