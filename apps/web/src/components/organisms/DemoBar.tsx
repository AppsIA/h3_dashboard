import { Zap } from 'lucide-react'

interface DemoBarProps {
  accountName?: string
}

export function DemoBar({ accountName }: DemoBarProps) {
  return (
    <div
      role="status"
      aria-label="Modo demonstração ativo"
      className="w-full bg-amber-500 text-text-inverse animate-demo-bar-flash"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2">
        <Zap size={13} aria-hidden className="flex-shrink-0" />
        <span className="text-caption font-sans font-semibold uppercase tracking-wide">
          MODO DEMO
          {accountName && (
            <span className="font-normal normal-case tracking-normal ml-1">
              — {accountName}
            </span>
          )}
        </span>
        <Zap size={13} aria-hidden className="flex-shrink-0" />
      </div>
    </div>
  )
}
