import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

export interface ErrorBoundaryProps {
  /** Content to render when no error */
  children: ReactNode
  /** Optional fallback UI to render on error */
  fallback?: ReactNode
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Whether to show detailed error info (dev mode) */
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - A global error boundary with TV-optimized recovery UI.
 *
 * Features:
 * - Catches JavaScript errors in child component tree
 * - TV-optimized recovery UI with spatial navigation
 * - "Try Again" button to reset and retry
 * - Optional error details for development
 * - Callback for error logging/reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { children, fallback, showDetails = false } = this.props
    const { hasError, error, errorInfo } = this.state

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <ErrorRecoveryUI
          error={error}
          errorInfo={errorInfo}
          showDetails={showDetails}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      )
    }

    return children
  }
}

interface ErrorRecoveryUIProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  onReset: () => void
  onReload: () => void
}

function ErrorRecoveryUI({
  error,
  errorInfo,
  showDetails,
  onReset,
  onReload,
}: ErrorRecoveryUIProps) {
  const { ref, focusKey } = useFocusable()

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="fixed inset-0 flex items-center justify-center bg-tv-background p-8"
        data-testid="error-boundary-ui"
      >
        <div className="max-w-lg w-full text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-tv-text mb-4">
            Something went wrong
          </h1>
          <p className="text-tv-text-secondary text-lg mb-8">
            An unexpected error occurred. You can try again or reload the app.
          </p>

          {/* Error Details (Development) */}
          {showDetails && error && (
            <div className="mb-8 text-left bg-tv-surface rounded-lg p-4 overflow-auto max-h-48">
              <p className="text-red-400 font-mono text-sm mb-2">
                {error.name}: {error.message}
              </p>
              {errorInfo?.componentStack && (
                <pre className="text-tv-text-secondary text-xs whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <RecoveryButton
              label="Try Again"
              onClick={onReset}
              primary
              testId="error-try-again-button"
            />
            <RecoveryButton
              label="Reload App"
              onClick={onReload}
              testId="error-reload-button"
            />
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}

interface RecoveryButtonProps {
  label: string
  onClick: () => void
  primary?: boolean
  testId?: string
}

function RecoveryButton({ label, onClick, primary = false, testId }: RecoveryButtonProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick,
  })

  const baseClasses = [
    'px-8',
    'py-4',
    'rounded-lg',
    'font-semibold',
    'text-lg',
    'transition-all',
    'duration-150',
    'outline-none',
    'border-2',
  ]

  const styleClasses = primary
    ? ['bg-tv-accent', 'text-white', 'border-tv-accent']
    : ['bg-tv-surface', 'text-tv-text', 'border-tv-border']

  const focusClasses = focused
    ? [
        'scale-105',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]',
        primary ? '' : 'border-tv-accent',
      ]
    : []

  const combinedClasses = [...baseClasses, ...styleClasses, ...focusClasses]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      className={combinedClasses}
      onClick={onClick}
      data-testid={testId}
      data-focused={focused}
    >
      {label}
    </button>
  )
}

export default ErrorBoundary
