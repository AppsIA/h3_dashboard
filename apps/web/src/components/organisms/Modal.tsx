'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Heading } from '../atoms/Typography'
import { Button } from '../atoms/Button'
import { Divider } from '../atoms/Divider'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (e: Event) => { e.preventDefault(); onClose() }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [onClose])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className={[
        'w-full bg-surface border border-border rounded-sm shadow-xl',
        'backdrop:bg-canvas/70 backdrop:backdrop-blur-sm',
        'p-0 m-auto',
        sizeClass[size],
      ].join(' ')}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex flex-col gap-1">
          <Heading level={2} size="sm" id="modal-title">{title}</Heading>
          {description && (
            <p id="modal-description" className="text-body-sm text-text-secondary font-sans">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
          <X size={16} />
        </Button>
      </div>

      <Divider />

      {/* Body */}
      <div className="px-6 py-5">{children}</div>

      {/* Footer */}
      {footer && (
        <>
          <Divider />
          <div className="px-6 py-4 flex items-center justify-end gap-3">{footer}</div>
        </>
      )}
    </dialog>
  )
}
