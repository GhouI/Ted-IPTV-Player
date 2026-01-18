import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../core/stores/playerStore'
import type { PlayerError } from '../../core/types/player'

/**
 * Configuration options for stream error handling
 */
export interface StreamErrorHandlerConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Base delay between retries in milliseconds */
  baseDelay?: number
  /** Backoff multiplier for exponential backoff */
  backoffFactor?: number
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number
  /** Whether to automatically retry recoverable errors */
  autoRetry?: boolean
  /** Callback when all retries are exhausted */
  onMaxRetriesReached?: (error: PlayerError) => void
  /** Callback when retry is attempted */
  onRetry?: (attempt: number, error: PlayerError) => void
  /** Callback when recovery is successful */
  onRecovered?: () => void
}

/**
 * Return value from useStreamErrorHandler hook
 */
export interface StreamErrorHandlerResult {
  /** Current error from player store */
  error: PlayerError | null
  /** Whether a retry is currently in progress */
  isRetrying: boolean
  /** Number of retry attempts made */
  retryCount: number
  /** Whether max retries have been reached */
  maxRetriesReached: boolean
  /** Manually trigger a retry */
  retry: () => void
  /** Reset error state and retry count */
  resetError: () => void
  /** Cancel any pending retry */
  cancelRetry: () => void
  /** Get formatted error message for display */
  getErrorMessage: () => string
  /** Check if error is recoverable */
  isRecoverable: boolean
}

const DEFAULT_CONFIG: Required<StreamErrorHandlerConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  autoRetry: true,
  onMaxRetriesReached: () => {},
  onRetry: () => {},
  onRecovered: () => {},
}

/**
 * Maps PlayerErrorCode to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  MEDIA_ERROR: 'Unable to play this stream. The media format may not be supported.',
  DECODE_ERROR: 'Error decoding the video stream.',
  SOURCE_NOT_SUPPORTED: 'This stream format is not supported on your device.',
  DRM_ERROR: 'Digital rights management error. This content may be protected.',
  MANIFEST_ERROR: 'Error loading the stream manifest.',
  SEGMENT_ERROR: 'Error loading video segments.',
  TIMEOUT_ERROR: 'The stream timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred during playback.',
}

/**
 * Hook for handling stream errors with retry logic
 *
 * Provides automatic retry functionality with exponential backoff for
 * recoverable stream errors. Supports manual retry for non-recoverable
 * errors and tracks retry attempts.
 *
 * @param reloadStream - Function to reload/retry the stream
 * @param config - Configuration options for error handling
 */
export function useStreamErrorHandler(
  reloadStream: () => Promise<void>,
  config: StreamErrorHandlerConfig = {}
): StreamErrorHandlerResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const {
    maxRetries,
    baseDelay,
    backoffFactor,
    maxDelay,
    autoRetry,
    onMaxRetriesReached,
    onRetry,
    onRecovered,
  } = mergedConfig

  const { error, setError, playbackState } = usePlayerStore()

  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetriesReached, setMaxRetriesReached] = useState(false)

  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousErrorRef = useRef<PlayerError | null>(null)

  /**
   * Calculate delay for the next retry using exponential backoff
   */
  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = baseDelay * Math.pow(backoffFactor, attempt)
      // Add jitter (0-25% of delay) to prevent thundering herd
      const jitter = delay * Math.random() * 0.25
      return Math.min(delay + jitter, maxDelay)
    },
    [baseDelay, backoffFactor, maxDelay]
  )

  /**
   * Cancel any pending retry attempt
   */
  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    setIsRetrying(false)
  }, [])

  /**
   * Reset error state and retry count
   */
  const resetError = useCallback(() => {
    cancelRetry()
    setRetryCount(0)
    setMaxRetriesReached(false)
    setError(null)
    previousErrorRef.current = null
  }, [cancelRetry, setError])

  /**
   * Perform a retry attempt
   */
  const performRetry = useCallback(async () => {
    if (!error) return

    const currentAttempt = retryCount + 1

    // Check if we've exceeded max retries
    if (currentAttempt > maxRetries) {
      setMaxRetriesReached(true)
      setIsRetrying(false)
      onMaxRetriesReached(error)
      return
    }

    setIsRetrying(true)
    onRetry(currentAttempt, error)

    try {
      // Clear error before retry
      setError(null)
      await reloadStream()

      // If we get here without error, recovery was successful
      setRetryCount(0)
      setMaxRetriesReached(false)
      setIsRetrying(false)
      onRecovered()
    } catch {
      // Retry failed, increment count
      setRetryCount(currentAttempt)
      setIsRetrying(false)

      // Error will be set by the player, which will trigger auto-retry if enabled
    }
  }, [
    error,
    retryCount,
    maxRetries,
    reloadStream,
    setError,
    onMaxRetriesReached,
    onRetry,
    onRecovered,
  ])

  /**
   * Manually trigger a retry
   */
  const retry = useCallback(() => {
    if (isRetrying) return

    // Reset max retries flag for manual retry
    if (maxRetriesReached) {
      setRetryCount(0)
      setMaxRetriesReached(false)
    }

    performRetry()
  }, [isRetrying, maxRetriesReached, performRetry])

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((): string => {
    if (!error) return ''
    return ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.UNKNOWN_ERROR
  }, [error])

  /**
   * Auto-retry logic for recoverable errors
   */
  useEffect(() => {
    // Only auto-retry if enabled, there's an error, it's recoverable, and we haven't maxed out
    if (
      !autoRetry ||
      !error ||
      !error.recoverable ||
      isRetrying ||
      maxRetriesReached ||
      retryCount >= maxRetries
    ) {
      return
    }

    // Check if this is a new error (not the same as the previous one being retried)
    const isSameError =
      previousErrorRef.current?.timestamp === error.timestamp &&
      previousErrorRef.current?.code === error.code

    if (isSameError) {
      return
    }

    previousErrorRef.current = error

    const delay = calculateDelay(retryCount)

    retryTimeoutRef.current = setTimeout(() => {
      performRetry()
    }, delay)

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [
    error,
    autoRetry,
    isRetrying,
    maxRetriesReached,
    retryCount,
    maxRetries,
    calculateDelay,
    performRetry,
  ])

  /**
   * Reset retry count when playback recovers (state changes to playing)
   */
  useEffect(() => {
    if (playbackState === 'playing' && retryCount > 0 && !isRetrying) {
      setRetryCount(0)
      setMaxRetriesReached(false)
      previousErrorRef.current = null
      onRecovered()
    }
  }, [playbackState, retryCount, isRetrying, onRecovered])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cancelRetry()
    }
  }, [cancelRetry])

  return {
    error,
    isRetrying,
    retryCount,
    maxRetriesReached,
    retry,
    resetError,
    cancelRetry,
    getErrorMessage,
    isRecoverable: error?.recoverable ?? false,
  }
}
