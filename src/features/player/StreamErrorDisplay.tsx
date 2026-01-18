import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { PlayerError } from '../../core/types/player'

export interface StreamErrorDisplayProps {
  /** The error to display */
  error: PlayerError | null
  /** User-friendly error message */
  errorMessage: string
  /** Whether a retry is in progress */
  isRetrying: boolean
  /** Number of retry attempts made */
  retryCount: number
  /** Maximum number of retries allowed */
  maxRetries?: number
  /** Whether max retries have been reached */
  maxRetriesReached: boolean
  /** Whether error is recoverable */
  isRecoverable: boolean
  /** Callback to trigger retry */
  onRetry: () => void
  /** Callback to go back/dismiss */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * StreamErrorDisplay - Shows stream error state with retry option
 *
 * Displays error information to the user with appropriate actions
 * based on whether the error is recoverable. Supports TV remote navigation.
 */
export function StreamErrorDisplay({
  error,
  errorMessage,
  isRetrying,
  retryCount,
  maxRetries = 3,
  maxRetriesReached,
  isRecoverable,
  onRetry,
  onBack,
  testId,
}: StreamErrorDisplayProps) {
  const { ref: retryRef, focused: retryFocused } = useFocusable({
    focusKey: 'error-retry-button',
    onEnterPress: () => !isRetrying && onRetry(),
  })

  const { ref: backRef, focused: backFocused } = useFocusable({
    focusKey: 'error-back-button',
    onEnterPress: () => onBack?.(),
  })

  if (!error) {
    return null
  }

  const showRetryButton = isRecoverable || maxRetriesReached
  const retryButtonText = isRetrying
    ? 'Retrying...'
    : maxRetriesReached
      ? 'Try Again'
      : `Retry (${retryCount}/${maxRetries})`

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8"
      data-testid={testId}
    >
      {/* Error Icon */}
      <div className="mb-6 text-red-500">
        <svg
          className="w-16 h-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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

      {/* Error Title */}
      <h2 className="text-2xl font-bold text-white mb-2">Playback Error</h2>

      {/* Error Message */}
      <p className="text-gray-300 text-center max-w-md mb-4" data-testid={testId ? `${testId}-message` : undefined}>
        {errorMessage}
      </p>

      {/* Error Code */}
      <p className="text-gray-500 text-sm mb-6" data-testid={testId ? `${testId}-code` : undefined}>
        Error code: {error.code}
      </p>

      {/* Retry Status */}
      {isRetrying && (
        <div className="flex items-center mb-6" data-testid={testId ? `${testId}-retrying` : undefined}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
          <span className="text-gray-300">Attempting to reconnect...</span>
        </div>
      )}

      {/* Retry Count Info */}
      {!isRetrying && retryCount > 0 && !maxRetriesReached && (
        <p className="text-gray-400 text-sm mb-6" data-testid={testId ? `${testId}-retry-count` : undefined}>
          Retry attempt {retryCount} of {maxRetries}
        </p>
      )}

      {/* Max Retries Warning */}
      {maxRetriesReached && (
        <p className="text-yellow-500 text-sm mb-6" data-testid={testId ? `${testId}-max-retries` : undefined}>
          Unable to connect after {maxRetries} attempts
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {showRetryButton && (
          <button
            ref={retryRef}
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              retryFocused
                ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } ${isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid={testId ? `${testId}-retry-button` : undefined}
          >
            {retryButtonText}
          </button>
        )}

        {onBack && (
          <button
            ref={backRef}
            type="button"
            onClick={onBack}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              backFocused
                ? 'bg-gray-500 text-white ring-4 ring-gray-300'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            data-testid={testId ? `${testId}-back-button` : undefined}
          >
            Go Back
          </button>
        )}
      </div>

      {/* Non-recoverable Error Message */}
      {!isRecoverable && !maxRetriesReached && (
        <p className="text-gray-500 text-sm mt-6">
          This error cannot be automatically recovered. Please try a different stream.
        </p>
      )}
    </div>
  )
}
