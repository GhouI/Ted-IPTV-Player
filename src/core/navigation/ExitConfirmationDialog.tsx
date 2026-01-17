import { useEffect, useRef } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

export interface ExitConfirmationDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean
  /** Callback when user confirms exit */
  onConfirm: () => void
  /** Callback when user cancels */
  onCancel: () => void
}

interface FocusableButtonProps {
  label: string
  onClick: () => void
  autoFocus?: boolean
  variant?: 'primary' | 'secondary'
}

function FocusableDialogButton({
  label,
  onClick,
  autoFocus = false,
  variant = 'secondary',
}: FocusableButtonProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick,
  })

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus()
    }
  }, [autoFocus, ref])

  const baseClasses =
    'px-8 py-3 rounded-lg text-tv-lg font-medium transition-all duration-200 outline-none'
  const variantClasses =
    variant === 'primary'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-tv-card text-tv-text hover:bg-tv-card-hover'
  const focusClasses = focused ? 'ring-4 ring-tv-focus scale-105' : ''

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses} ${focusClasses}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

/**
 * Exit confirmation dialog shown when the user presses back at the root level.
 * Provides Cancel and Exit buttons with TV remote navigation support.
 */
export function ExitConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ExitConfirmationDialogProps) {
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: true,
    focusKey: 'exit-dialog',
    preferredChildFocusKey: 'exit-cancel-btn',
  })
  const previousFocusRef = useRef<Element | null>(null)

  // Store the previously focused element and restore it on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
    >
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          className="mx-4 w-full max-w-md rounded-xl bg-tv-surface p-8 shadow-2xl"
        >
          <h2
            id="exit-dialog-title"
            className="mb-4 text-center text-tv-2xl font-bold text-tv-text"
          >
            Exit App?
          </h2>
          <p className="mb-8 text-center text-tv-lg text-tv-text-muted">
            Are you sure you want to exit Ted IPTV Player?
          </p>
          <div className="flex justify-center gap-4">
            <FocusableDialogButton
              label="Cancel"
              onClick={onCancel}
              autoFocus
              variant="secondary"
            />
            <FocusableDialogButton
              label="Exit"
              onClick={onConfirm}
              variant="primary"
            />
          </div>
        </div>
      </FocusContext.Provider>
    </div>
  )
}
