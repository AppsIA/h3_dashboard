import type { RoasInput, RoasResult } from './types.js'

/**
 * ROAS first_sale: receita da primeira venda confirmada dentro da janela de atribuição.
 * Default para venda única, infoproduto, e-commerce transacional.
 *
 * Fórmula: ROAS = receita_primeira_venda / investimento
 * Janela: configurável por Conta (default 30 dias)
 */
export function calculateFirstSaleRoas(input: RoasInput): RoasResult {
  const window = input.attributionWindowDays ?? 30
  const roas = input.totalSpend > 0
    ? parseFloat((input.totalRevenue / input.totalSpend).toFixed(4))
    : 0

  return {
    roas: {
      value: roas,
      method: 'first_sale',
      source: 'H3 CRM',
      attributionWindowDays: window,
      formulaLabel: `ROAS first_sale · janela ${window}d · fonte: H3 CRM`,
    },
    totals: {
      totalSpend: input.totalSpend,
      totalRevenue: input.totalRevenue,
      salesCount: input.salesCount,
      currency: 'BRL',
    },
  }
}
