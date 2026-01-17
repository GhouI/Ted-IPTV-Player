import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Modal title displayed in the header */
  title?: string
  /** Modal content */
  children: ReactNode
  /** Additional CSS classes for the modal container */
  className?: string
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Whether pressing Escape/Back closes the modal */
  closeOnEscape?: boolean
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean
  /** Size preset for the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Test ID for testing purposes */
  testId?: string
  /** Unique focus key for the modal */
  focusKey?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
} as const

/**
 * Modal - A TV-optimized modal dialog component with focus trapping.
 *
 * Features:
 * - Focus trapping within modal boundaries via Norigin Spatial Navigation
 * - Restores focus to previously focused element on close
 * - Escape/Back key support for closing
 * - Backdrop click support for closing
 * - Multiple size presets
 * - TV-optimized styling with proper focus states
 * - Accessible with proper ARIA attributes
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = false,
  closeOnEscape = true,
  closeOnBackdrop = true,
  size = 'md',
  testId,
  focusKey = 'modal',
}: ModalProps) {
  const { ref, focusKey: contextFocusKey } = useFocusable({
    isFocusBoundary: true,
    focusKey,
    focusBoundaryDirections: ['up', 'down', 'left', 'right'],
  })
  const previousFocusRef = useRef<Element | null>(null)

  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Handle Escape/Back key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key or Back button (common TV remote codes)
      if (
        event.key === 'Escape' ||
        event.key === 'Backspace' ||
        event.keyCode === 10009 || // Samsung/LG Back
        event.keyCode === 461 // Hisense/VIDAA Back
      ) {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose()
    }
  }

  const sizeClass = sizeClasses[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      data-testid={testId}
      onClick={handleBackdropClick}
    >
      <FocusContext.Provider value={contextFocusKey}>
        <div
          ref={ref}
          className={`mx-4 w-full ${sizeClass} rounded-xl bg-tv-surface p-6 shadow-2xl ${className}`}
        >
          {(title || showCloseButton) && (
            <div className="mb-4 flex items-center justify-between">
              {title && (
                <h2
                  id="modal-title"
                  className="text-tv-2xl font-bold text-tv-text"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <CloseButton onClose={onClose} />
              )}
            </div>
          )}
          {children}
        </div>
      </FocusContext.Provider>
    </div>
  )
}

interface CloseButtonProps {
  onClose: () => void
}

function CloseButton({ onClose }: CloseButtonProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClose,
    focusKey: 'modal-close-btn',
  })

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClose}
      className={`rounded-lg p-2 text-tv-text-muted transition-all duration-150 hover:bg-tv-card hover:text-tv-text ${
        focused ? 'bg-tv-card text-tv-text ring-2 ring-tv-accent' : ''
      }`}
      aria-label="Close modal"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  )
}
