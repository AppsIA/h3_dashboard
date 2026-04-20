import { calculateFirstSaleRoas }    from './first-sale.js'
import { calculateCohortLtvRoas }    from './cohort-ltv.js'
import { calculateMultiProductRoas } from './multi-product.js'
import type { RoasInput, RoasResult, RevenueModel } from './types.js'

/**
 * Dispatcher principal de ROAS.
 * Recebe o input com os dados da Conta e executa a fórmula correta.
 * A fórmula é determinada pelo revenue_model da Conta — o usuário não escolhe.
 */
export function calculateRoas(input: RoasInput): RoasResult {
  switch (input.revenueModel) {
    case 'first_sale':
      return calculateFirstSaleRoas(input)
    case 'cohort_ltv':
      return calculateCohortLtvRoas(input)
    case 'multi_product':
      return calculateMultiProductRoas(input)
    default:
      throw new Error(`Revenue model desconhecido: ${input.revenueModel satisfies never}`)
  }
}

export function getAttributionWindowForModel(
  model: RevenueModel,
  configuredDays?: number
): number {
  if (configuredDays) return configuredDays
  switch (model) {
    case 'first_sale':    return 30
    case 'cohort_ltv':    return 90
    case 'multi_product': return 45
  }
}

export type { RoasInput, RoasResult, RoasMetadata, RevenueModel } from './types.js'
