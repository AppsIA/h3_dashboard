/**
 * H3 Dashboard Design Tokens
 * Single source of truth para todos os valores visuais.
 * Espelha o tailwind.config.ts — use tokens TypeScript nos componentes dinâmicos.
 */

export const colors = {
  canvas:  '#0D0D0D',
  surface: {
    default:  '#141414',
    elevated: '#1A1A1A',
    overlay:  '#1F1F1F',
  },
  border: {
    default: '#242424',
    subtle:  '#1C1C1C',
    strong:  '#3A3A3A',
    accent:  '#FFB800',
  },
  text: {
    primary:   '#F5F5F5',
    secondary: '#8A8A8A',
    tertiary:  '#5A5A5A',
    disabled:  '#3A3A3A',
    inverse:   '#0D0D0D',
  },
  amber: {
    500: '#FFB800',
    900: '#3D2A00',
  },
  success:  { default: '#22C55E', bg: '#0D2A17' },
  error:    { default: '#EF4444', bg: '#2A0D0D' },
  warning:  { default: '#F59E0B', bg: '#2A1A05' },
  info:     { default: '#3B82F6', bg: '#0D1A2A' },
} as const

export const typography = {
  fontFamily: {
    sans: "'Space Grotesk', system-ui, sans-serif",
    mono: "'IBM Plex Mono', Consolas, monospace",
  },
  // Usar para estilos inline em componentes com valores dinâmicos
  scale: {
    metricHero:  { fontSize: '72px', lineHeight: '1.0',  fontWeight: '700',  letterSpacing: '-0.02em' },
    metricLarge: { fontSize: '48px', lineHeight: '1.05', fontWeight: '600',  letterSpacing: '-0.01em' },
    metricMed:   { fontSize: '32px', lineHeight: '1.1',  fontWeight: '500',  letterSpacing: '0'       },
    metricSm:    { fontSize: '24px', lineHeight: '1.2',  fontWeight: '500',  letterSpacing: '0'       },
    formula:     { fontSize: '11px', lineHeight: '1.5',  fontWeight: '400',  letterSpacing: '0'       },
    labelUpper:  { fontSize: '11px', lineHeight: '1.4',  fontWeight: '500',  letterSpacing: '0.1em'   },
  },
} as const

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const

export const radius = {
  chip: '2px',
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
} as const

export const shadow = {
  focus: '0 0 0 2px rgba(255, 184, 0, 0.5)',
  error: '0 0 0 2px rgba(239, 68, 68, 0.4)',
} as const

// ─── Mapeamento de plataformas ─────────────────────────────────────────────

export const platformColors = {
  meta:             { bg: '#1A2A4A', text: '#4267B2', label: 'Meta Ads' },
  google:           { bg: '#2A1A1A', text: '#EA4335', label: 'Google Ads' },
  tiktok:           { bg: '#1A1A1A', text: '#F5F5F5', label: 'TikTok Ads' },
  instagram_organic:{ bg: '#1A2A1A', text: '#22C55E', label: 'Instagram Orgânico' },
} as const

// ─── Mapeamento de objetivos ───────────────────────────────────────────────

export const objectiveColors = {
  captacao:    { bg: '#3D2A00', text: '#FFB800', label: 'Captação',         icon: 'Users'       },
  venda_direta:{ bg: '#0D2A17', text: '#22C55E', label: 'Venda Direta',     icon: 'ShoppingBag' },
  alcance:     { bg: '#0D1A2A', text: '#3B82F6', label: 'Alcance',          icon: 'Eye'         },
  seguidores:  { bg: '#1F0D2A', text: '#A855F7', label: 'Seguidores',       icon: 'Heart'       },
} as const

export type PlatformKey  = keyof typeof platformColors
export type ObjectiveKey = keyof typeof objectiveColors
