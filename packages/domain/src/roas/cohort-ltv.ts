import type { RoasInput, RoasResult } from './types.js'

/**
 * ROAS cohort_ltv: considera o LTV da coorte ao longo do tempo.
 * Para recorrentes: academia, SaaS, assinaturas.
 *
 * Fórmula:
 *   ROAS = (receita_média_mensal × tempo_médio_permanência × margem) / investimento_da_coorte
 *
 * O número estabiliza em 3–6 meses. Para coortes mais jovens, retorna
 * isStable=false e expectedStableAt com a data esperada de estabilização.
 */
export function calculateCohortLtvRoas(input: RoasInput): RoasResult {
  const avgMonths = input.cohortAvgMonths ?? 6
  const margin = input.cohortMargin ?? 0.4

  // Receita média mensal da coorte
  const periodMonths = Math.max(
    1,
    (input.periodTo.getTime() - input.periodFrom.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const avgMonthlyRevenue = input.totalRevenue / periodMonths

  // LTV projetado
  const projectedLtv = avgMonthlyRevenue * avgMonths * margin

  const roas = input.totalSpend > 0
    ? parseFloat((projectedLtv / input.totalSpend).toFixed(4))
    : 0

  // Coorte considera estável após 3 meses de dados
  const isStable = periodMonths >= 3
  const expectedStableAt = isStable
    ? undefined
    : new Date(input.periodFrom.getTime() + 3 * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

  return {
    roas: {
      value: roas,
      method: 'cohort_ltv',
      source: 'H3 CRM',
      cohortAvgMonths: avgMonths,
      cohortMargin: margin,
      isStable,
      expectedStableAt,
      formulaLabel: `ROAS cohort_ltv · LTV ${avgMonths}m · margem ${Math.round(margin * 100)}% · fonte: H3 CRM`,
    },
    totals: {
      totalSpend: input.totalSpend,
      totalRevenue: input.totalRevenue,
      salesCount: input.salesCount,
      currency: 'BRL',
    },
  }
}
