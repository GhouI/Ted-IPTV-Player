import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export interface ToastProviderProps {
  children: ReactNode
  /** Maximum number of toasts to display at once */
  maxToasts?: number
  /** Default duration in milliseconds */
  defaultDuration?: number
  /** Position of toasts on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  /** Test ID for the toast container */
  testId?: string
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
} as const

const typeStyles = {
  info: {
    bg: 'bg-tv-accent',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-tv-success',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-tv-warning',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-tv-error',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
} as const

let toastIdCounter = 0

function generateToastId(): string {
  return `toast-${++toastIdCounter}`
}

/**
 * ToastProvider - Provides toast notification functionality to the app.
 *
 * Features:
 * - Multiple toast types (info, success, warning, error)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss support
 * - Configurable position
 * - Maximum toast limit to prevent overflow
 * - TV-optimized styling with proper contrast
 * - Smooth enter/exit animations
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
  position = 'top-right',
  testId,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number): string => {
      const id = generateToastId()
      const newToast: Toast = {
        id,
        message,
        type,
        duration: duration ?? defaultDuration,
      }

      setToasts((prev) => {
        const updated = [...prev, newToast]
        // Remove oldest toasts if exceeding max
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts)
        }
        return updated
      })

      return id
    },
    [defaultDuration, maxToasts]
  )

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position={position}
        testId={testId}
      />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
  position: ToastProviderProps['position']
  testId?: string
}

function ToastContainer({ toasts, onRemove, position = 'top-right', testId }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className={`fixed z-[100] flex flex-col gap-3 ${positionClasses[position]}`}
      role="region"
      aria-label="Notifications"
      data-testid={testId}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const styles = typeStyles[toast.type]

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  // Exit animation then remove
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, 200) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isExiting, onRemove, toast.id])

  const handleDismiss = () => {
    setIsExiting(true)
  }

  return (
    <div
      className={`flex min-w-[300px] max-w-md items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg transition-all duration-200 ${styles.bg} ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-4 opacity-0'
      }`}
      role="alert"
      data-testid={`toast-${toast.id}`}
      data-type={toast.type}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {styles.icon}
      </span>
      <span className="flex-1 text-tv-base font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 rounded p-1 transition-colors hover:bg-white/20"
        aria-label="Dismiss notification"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/**
 * useToast - Hook to access toast functionality.
 *
 * Must be used within a ToastProvider.
 *
 * @returns Toast context with addToast, removeToast, and clearToasts functions
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
