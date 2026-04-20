export type RevenueModel = 'first_sale' | 'cohort_ltv' | 'multi_product'

export interface RoasMetadata {
  value: number
  method: RevenueModel
  source: 'H3 CRM'
  formulaLabel: string
  attributionWindowDays?: number    // first_sale, multi_product
  cohortAvgMonths?: number           // cohort_ltv
  cohortMargin?: number              // cohort_ltv
  isStable?: boolean                 // cohort_ltv: false enquanto coorte < 3 meses
  expectedStableAt?: string          // cohort_ltv: ISO date
}

export interface RoasInput {
  revenueModel: RevenueModel
  totalSpend: number
  totalRevenue: number
  salesCount: number
  attributionWindowDays?: number
  cohortAvgMonths?: number
  cohortMargin?: number
  periodFrom: Date
  periodTo: Date
}

export interface CohortData {
  month: number           // 1, 2, 3...
  revenue: number
  salesCount: number
}

export interface RoasResult {
  roas: RoasMetadata
  totals: {
    totalSpend: number
    totalRevenue: number
    salesCount: number
    currency: 'BRL'
  }
}
