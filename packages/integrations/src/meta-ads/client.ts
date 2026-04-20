import ky from 'ky'

const META_API_VERSION = 'v21.0'
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

export interface MetaAdInsight {
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  ad_id: string
  ad_name: string
  date_start: string
  date_stop: string
  spend: string
  impressions: string
  clicks: string
  actions?: Array<{ action_type: string; value: string }>
}

export interface MetaInsightsParams {
  adAccountId: string  // sem 'act_' prefix — adicionamos aqui
  dateStart: string    // YYYY-MM-DD
  dateStop: string     // YYYY-MM-DD
  level?: 'campaign' | 'adset' | 'ad'
}

function buildMetaClient(accessToken: string) {
  return ky.create({
    prefixUrl: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
    retry: { limit: 3, delay: (attempt) => Math.min(1000 * 2 ** attempt, 30000) },
    timeout: 60_000,
  })
}

export async function fetchMetaInsights(
  params: MetaInsightsParams,
  accessToken: string
): Promise<MetaAdInsight[]> {
  const client = buildMetaClient(accessToken)
  const accountId = `act_${params.adAccountId}`
  const level = params.level ?? 'ad'

  const fields = [
    'campaign_id', 'campaign_name',
    'adset_id', 'adset_name',
    'ad_id', 'ad_name',
    'spend', 'impressions', 'clicks', 'actions',
  ].join(',')

  const results: MetaAdInsight[] = []
  let after: string | undefined

  // Paginação automática (cursor-based)
  do {
    const searchParams: Record<string, string> = {
      fields,
      level,
      time_range: JSON.stringify({ since: params.dateStart, until: params.dateStop }),
      time_increment: '1',
      limit: '500',
    }
    if (after) searchParams['after'] = after

    const response = await client
      .get(`${accountId}/insights`, { searchParams })
      .json<{ data: MetaAdInsight[]; paging?: { cursors?: { after?: string }; next?: string } }>()

    results.push(...response.data)
    after = response.paging?.next ? response.paging.cursors?.after : undefined
  } while (after)

  return results
}

/**
 * Busca campanhas ativas de uma conta (para sincronizar estrutura)
 */
export async function fetchMetaCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<Array<{ id: string; name: string; status: string; objective: string; created_time: string }>> {
  const client = buildMetaClient(accessToken)
  const accountId = `act_${adAccountId}`

  const response = await client
    .get(`${accountId}/campaigns`, {
      searchParams: {
        fields: 'id,name,status,objective,created_time',
        limit: '200',
      },
    })
    .json<{ data: Array<{ id: string; name: string; status: string; objective: string; created_time: string }> }>()

  return response.data
}
