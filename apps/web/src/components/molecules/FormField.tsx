import type { ReactNode, InputHTMLAttributes } from 'react'
import { Input } from '../atoms/Input'
import { Text } from '../atoms/Typography'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hint?: string
  error?: string
  leftElement?: ReactNode
  rightElement?: ReactNode
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function FormField({
  label,
  hint,
  error,
  leftElement,
  rightElement,
  required,
  size = 'md',
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-body-sm font-medium text-text-primary font-sans">
          {label}
          {required && <span className="text-error ml-1" aria-hidden>*</span>}
        </label>
        {hint && !error && (
          <Text size="xs" variant="tertiary">{hint}</Text>
        )}
      </div>
      <Input
        {...inputProps}
        size={size}
        error={error}
        leftElement={leftElement}
        rightElement={rightElement}
        aria-required={required}
      />
      {error && (
        <Text size="xs" variant="error" role="alert">{error}</Text>
      )}
    </div>
  )
}
