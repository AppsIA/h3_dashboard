import ky from 'ky'
import { createHmac } from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// H3 CRM Client
// Fonte de verdade para leads e vendas.
// A API REST do CRM é consumida via pull (polling incremental) + webhook push.
// ─────────────────────────────────────────────────────────────────────────────

export interface CrmLead {
  id: string
  account_crm_id: string
  status: 'novo' | 'qualificado' | 'negociacao' | 'ganho' | 'perdido'
  name: string
  email: string
  phone: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  whatsapp_number?: string
  entry_point?: string
  first_contact_at: string
  qualified_at?: string
  updated_at: string
}

export interface CrmSale {
  id: string
  lead_id: string
  account_crm_id: string
  product_crm_id?: string
  amount: number
  currency: string
  status: 'confirmed' | 'refunded' | 'chargeback'
  is_recurring: boolean
  subscription_month?: number
  confirmed_at: string
  updated_at: string
}

function buildCrmClient() {
  const baseUrl = process.env.H3_CRM_BASE_URL
  const apiKey  = process.env.H3_CRM_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error('H3_CRM_BASE_URL e H3_CRM_API_KEY são obrigatórios')
  }
  return ky.create({
    prefixUrl: baseUrl,
    headers: { Authorization: `Bearer ${apiKey}` },
    retry: { limit: 3, delay: (n) => Math.min(1000 * 2 ** n, 30_000) },
    timeout: 30_000,
  })
}

/**
 * Pull incremental de leads atualizados após `updatedAfter`.
 * Suporta paginação cursor.
 */
export async function fetchLeadsIncremental(
  accountCrmId: string,
  updatedAfter: Date
): Promise<CrmLead[]> {
  const client = buildCrmClient()
  const results: CrmLead[] = []
  let page = 1

  while (true) {
    const response = await client
      .get('leads', {
        searchParams: {
          account_id: accountCrmId,
          updated_after: updatedAfter.toISOString(),
          page: page.toString(),
          limit: '200',
        },
      })
      .json<{ data: CrmLead[]; has_more: boolean }>()

    results.push(...response.data)
    if (!response.has_more) break
    page++
  }

  return results
}

/**
 * Pull incremental de vendas atualizadas após `updatedAfter`.
 */
export async function fetchSalesIncremental(
  accountCrmId: string,
  updatedAfter: Date
): Promise<CrmSale[]> {
  const client = buildCrmClient()
  const results: CrmSale[] = []
  let page = 1

  while (true) {
    const response = await client
      .get('sales', {
        searchParams: {
          account_id: accountCrmId,
          updated_after: updatedAfter.toISOString(),
          page: page.toString(),
          limit: '200',
        },
      })
      .json<{ data: CrmSale[]; has_more: boolean }>()

    results.push(...response.data)
    if (!response.has_more) break
    page++
  }

  return results
}

/**
 * Valida assinatura HMAC-SHA256 do webhook do CRM.
 * Header: X-H3-Signature: sha256=<hex>
 */
export function validateCrmWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const secret = process.env.H3_CRM_WEBHOOK_SECRET
  if (!secret) throw new Error('H3_CRM_WEBHOOK_SECRET não configurado')

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  return signatureHeader === expected
}
