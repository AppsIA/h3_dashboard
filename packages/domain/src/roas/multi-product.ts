import type { RoasInput, RoasResult } from './types.js'

/**
 * ROAS multi_product: soma a receita de TODOS os produtos comprados pelo lead
 * dentro da janela de atribuição. Atribuição first-touch pela Campanha original.
 * Para contas com múltiplos produtos (cross-sell).
 *
 * Fórmula: ROAS = soma(receita_de_todos_produtos_do_lead_na_janela) / investimento
 */
export function calculateMultiProductRoas(input: RoasInput): RoasResult {
  const window = input.attributionWindowDays ?? 45
  const roas = input.totalSpend > 0
    ? parseFloat((input.totalRevenue / input.totalSpend).toFixed(4))
    : 0

  return {
    roas: {
      value: roas,
      method: 'multi_product',
      source: 'H3 CRM',
      attributionWindowDays: window,
      formulaLabel: `ROAS multi_product · janela ${window}d · first-touch · fonte: H3 CRM`,
    },
    totals: {
      totalSpend: input.totalSpend,
      totalRevenue: input.totalRevenue,
      salesCount: input.salesCount,
      currency: 'BRL',
    },
  }
}
