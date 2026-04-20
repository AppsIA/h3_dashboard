import type { HTMLAttributes, ReactNode } from 'react'

// ─── Heading ──────────────────────────────────────────────────────────────

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingSize  = 'hero' | 'lg' | 'md' | 'sm'

const headingSize: Record<HeadingSize, string> = {
  hero: 'text-heading-lg font-bold font-sans tracking-tight',
  lg:   'text-heading font-bold font-sans tracking-tight',
  md:   'text-heading-sm font-semibold font-sans',
  sm:   'text-body-lg font-semibold font-sans',
}

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  size?: HeadingSize
  children: ReactNode
}

export function Heading({ level = 2, size = 'md', children, className = '', ...props }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return (
    <Tag
      className={`text-text-primary ${headingSize[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

// ─── Text ──────────────────────────────────────────────────────────────────

type TextSize    = 'xs' | 'sm' | 'base' | 'lg'
type TextVariant = 'primary' | 'secondary' | 'tertiary' | 'amber' | 'success' | 'error'

const textSize: Record<TextSize, string> = {
  xs:   'text-caption',
  sm:   'text-body-sm',
  base: 'text-body',
  lg:   'text-body-lg',
}

const textVariant: Record<TextVariant, string> = {
  primary:   'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary:  'text-text-tertiary',
  amber:     'text-amber-500',
  success:   'text-success',
  error:     'text-error',
}

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: TextSize
  variant?: TextVariant
  children: ReactNode
  as?: 'p' | 'span' | 'div' | 'label' | 'li'
}

export function Text({ size = 'base', variant = 'primary', as: Tag = 'p', children, className = '', ...props }: TextProps) {
  return (
    <Tag
      className={`font-sans ${textSize[size]} ${textVariant[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

// ─── Metric — números em IBM Plex Mono ────────────────────────────────────

type MetricSize = 'hero' | 'large' | 'med' | 'sm'

const metricSize: Record<MetricSize, string> = {
  hero:  'text-metric-hero font-bold',
  large: 'text-metric-large font-semibold',
  med:   'text-metric-med font-medium',
  sm:    'text-metric-sm font-medium',
}

interface MetricProps extends HTMLAttributes<HTMLSpanElement> {
  size?: MetricSize
  amber?: boolean
  children: ReactNode
}

export function Metric({ size = 'med', amber = false, children, className = '', ...props }: MetricProps) {
  return (
    <span
      className={[
        'font-mono',
        metricSize[size],
        amber ? 'text-amber-500' : 'text-text-primary',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── FormulaLabel — metadado obrigatório de ROAS ──────────────────────────

interface FormulaLabelProps {
  label: string
  className?: string
}

export function FormulaLabel({ label, className = '' }: FormulaLabelProps) {
  return (
    <span
      className={`block font-mono text-formula text-text-tertiary ${className}`}
      aria-label={`Metodologia: ${label}`}
    >
      {label}
    </span>
  )
}

// ─── UpperLabel — labels uppercase estilo H3 ─────────────────────────────

interface UpperLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

export function UpperLabel({ children, className = '', ...props }: UpperLabelProps) {
  return (
    <span
      className={`block font-mono text-label-upper uppercase text-text-tertiary tracking-widest ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
