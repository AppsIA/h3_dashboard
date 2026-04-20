import type { ReactNode } from 'react'
import { Text } from '../atoms/Typography'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-sm flex items-center justify-center">
            <span className="font-mono font-bold text-text-inverse text-lg">H3</span>
          </div>
          {title && (
            <div className="text-center flex flex-col gap-1">
              <h1 className="text-heading-sm font-semibold font-sans text-text-primary">{title}</h1>
              {subtitle && (
                <Text size="sm" variant="secondary" className="text-center">{subtitle}</Text>
              )}
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-sm p-8">
          {children}
        </div>

        <Text size="xs" variant="tertiary" className="text-center">
          H3 Labs — Sistemas previsíveis de crescimento
        </Text>
      </div>
    </div>
  )
}
