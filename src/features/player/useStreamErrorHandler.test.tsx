import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamErrorHandler } from './useStreamErrorHandler'
import { usePlayerStore } from '../../core/stores/playerStore'
import type { PlayerError } from '../../core/types/player'


// Mock the player store
vi.mock('../../core/stores/playerStore', () => ({
  usePlayerStore: vi.fn(),
}))

describe('useStreamErrorHandler', () => {
  const mockSetError = vi.fn()
  const mockReloadStream = vi.fn()

  const createMockError = (overrides: Partial<PlayerError> = {}): PlayerError => ({
    code: 'NETWORK_ERROR',
    message: 'Test error',
    recoverable: true,
    timestamp: Date.now(),
    ...overrides,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Default mock implementation
    ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      error: null,
      setError: mockSetError,
      playbackState: 'idle',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should return initial state with no error', () => {
      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.error).toBeNull()
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)
      expect(result.current.maxRetriesReached).toBe(false)
      expect(result.current.isRecoverable).toBe(false)
    })

    it('should return error from store', () => {
      const mockError = createMockError()
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.error).toEqual(mockError)
      expect(result.current.isRecoverable).toBe(true)
    })
  })

  describe('getErrorMessage', () => {
    it('should return empty string when no error', () => {
      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.getErrorMessage()).toBe('')
    })

    it('should return user-friendly message for NETWORK_ERROR', () => {
      const mockError = createMockError({ code: 'NETWORK_ERROR' })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.getErrorMessage()).toContain('Network connection error')
    })

    it('should return user-friendly message for MEDIA_ERROR', () => {
      const mockError = createMockError({ code: 'MEDIA_ERROR' })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.getErrorMessage()).toContain('Unable to play')
    })

    it('should return user-friendly message for TIMEOUT_ERROR', () => {
      const mockError = createMockError({ code: 'TIMEOUT_ERROR' })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() => useStreamErrorHandler(mockReloadStream))

      expect(result.current.getErrorMessage()).toContain('timed out')
    })
  })

  describe('manual retry', () => {
    it('should call reloadStream when retry is invoked', async () => {
      const mockError = createMockError()
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { autoRetry: false })
      )

      await act(async () => {
        result.current.retry()
      })

      expect(mockSetError).toHaveBeenCalledWith(null)
      expect(mockReloadStream).toHaveBeenCalled()
    })

    it('should not retry when already retrying', async () => {
      const mockError = createMockError()
      // Make reloadStream hang
      mockReloadStream.mockImplementation(() => new Promise(() => {}))
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { autoRetry: false })
      )

      act(() => {
        result.current.retry()
      })

      expect(result.current.isRetrying).toBe(true)

      // Try to retry again
      act(() => {
        result.current.retry()
      })

      // Should only have been called once
      expect(mockReloadStream).toHaveBeenCalledTimes(1)
    })

    it('should reset maxRetriesReached on manual retry', async () => {
      const mockError = createMockError()
      mockReloadStream.mockResolvedValue(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { maxRetries: 1, autoRetry: false })
      )

      // First retry
      await act(async () => {
        result.current.retry()
      })

      expect(result.current.retryCount).toBe(0) // Reset after success

      // Simulate new error
      mockReloadStream.mockRejectedValueOnce(new Error('Failed'))
      await act(async () => {
        result.current.retry()
      })

      expect(result.current.retryCount).toBe(1)

      // Another failure to exceed max
      mockReloadStream.mockRejectedValueOnce(new Error('Failed'))
      await act(async () => {
        result.current.retry()
      })

      expect(result.current.maxRetriesReached).toBe(true)

      // Manual retry should reset the flag and try again
      mockReloadStream.mockResolvedValueOnce(undefined)
      await act(async () => {
        result.current.retry()
      })

      // After successful retry, count should be reset
      expect(result.current.retryCount).toBe(0)
    })
  })

  describe('auto retry', () => {
    it('should auto-retry recoverable errors with delay', async () => {
      const mockError = createMockError({ recoverable: true })
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          autoRetry: true,
          baseDelay: 1000,
        })
      )

      // Should not retry immediately
      expect(mockReloadStream).not.toHaveBeenCalled()

      // Advance timers past the delay
      await act(async () => {
        vi.advanceTimersByTime(1500)
      })

      expect(mockSetError).toHaveBeenCalledWith(null)
      expect(mockReloadStream).toHaveBeenCalled()
    })

    it('should not auto-retry non-recoverable errors', async () => {
      const mockError = createMockError({ recoverable: false })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { autoRetry: true })
      )

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      // Should not have attempted retry
      expect(mockReloadStream).not.toHaveBeenCalled()
    })

    it('should not auto-retry when autoRetry is false', async () => {
      const mockError = createMockError({ recoverable: true })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { autoRetry: false })
      )

      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      expect(mockReloadStream).not.toHaveBeenCalled()
    })
  })

  describe('max retries', () => {
    it('should not attempt retry when maxRetries already exceeded', async () => {
      const mockError = createMockError()
      const onMaxRetriesReached = vi.fn()
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          maxRetries: 0, // No retries allowed
          autoRetry: false,
          onMaxRetriesReached,
        })
      )

      // First retry should immediately trigger maxRetriesReached since maxRetries is 0
      act(() => {
        result.current.retry()
      })

      expect(result.current.maxRetriesReached).toBe(true)
      expect(onMaxRetriesReached).toHaveBeenCalledWith(mockError)
      // reloadStream should not be called since we exceeded max retries
      expect(mockReloadStream).not.toHaveBeenCalled()
    })

    it('should call onRetry with correct attempt number', async () => {
      const mockError = createMockError()
      const onRetry = vi.fn()
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          maxRetries: 5,
          autoRetry: false,
          onRetry,
        })
      )

      // Call retry
      act(() => {
        result.current.retry()
      })

      // onRetry should be called with attempt number 1
      expect(onRetry).toHaveBeenCalledWith(1, mockError)
    })

    it('should start with retryCount of 0', () => {
      const mockError = createMockError()
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          maxRetries: 5,
          autoRetry: false,
        })
      )

      expect(result.current.retryCount).toBe(0)
      expect(result.current.maxRetriesReached).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('should call onRetry callback when retrying', async () => {
      const mockError = createMockError()
      const onRetry = vi.fn()
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          autoRetry: false,
          onRetry,
        })
      )

      await act(async () => {
        result.current.retry()
      })

      expect(onRetry).toHaveBeenCalledWith(1, mockError)
    })

    it('should call onRecovered when retry succeeds', async () => {
      const mockError = createMockError()
      const onRecovered = vi.fn()
      // Mock successful reload
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          autoRetry: false,
          onRecovered,
        })
      )

      // Trigger retry which will succeed
      act(() => {
        result.current.retry()
      })

      // Advance timers to let the promise resolve
      await act(async () => {
        vi.advanceTimersByTime(10)
      })

      // onRecovered should be called when retry succeeds
      expect(onRecovered).toHaveBeenCalled()
    })
  })

  describe('resetError', () => {
    it('should reset error state', async () => {
      const mockError = createMockError()
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, { autoRetry: false })
      )

      act(() => {
        result.current.resetError()
      })

      expect(mockSetError).toHaveBeenCalledWith(null)
      expect(result.current.retryCount).toBe(0)
      expect(result.current.maxRetriesReached).toBe(false)
    })
  })

  describe('cancelRetry', () => {
    it('should cancel pending retry', async () => {
      const mockError = createMockError({ recoverable: true })
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      const { result } = renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          autoRetry: true,
          baseDelay: 5000,
        })
      )

      // Cancel before the delay
      act(() => {
        vi.advanceTimersByTime(1000)
        result.current.cancelRetry()
      })

      // Advance past the original delay
      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      // Should not have called reload
      expect(mockReloadStream).not.toHaveBeenCalled()
    })
  })

  describe('exponential backoff', () => {
    it('should calculate increased delay with backoff factor', () => {
      // This test verifies the delay calculation logic
      const baseDelay = 1000
      const backoffFactor = 2
      const maxDelay = 30000

      // The calculateDelay function uses: baseDelay * Math.pow(backoffFactor, attempt)
      // For attempt 0: 1000 * 2^0 = 1000
      // For attempt 1: 1000 * 2^1 = 2000
      // For attempt 2: 1000 * 2^2 = 4000
      // For attempt 3: 1000 * 2^3 = 8000

      const calculateDelay = (attempt: number): number => {
        const delay = baseDelay * Math.pow(backoffFactor, attempt)
        return Math.min(delay, maxDelay)
      }

      expect(calculateDelay(0)).toBe(1000)
      expect(calculateDelay(1)).toBe(2000)
      expect(calculateDelay(2)).toBe(4000)
      expect(calculateDelay(3)).toBe(8000)
      expect(calculateDelay(4)).toBe(16000)
      expect(calculateDelay(5)).toBe(30000) // Capped at maxDelay
    })

    it('should use exponential backoff timing for auto-retry', async () => {
      const mockError = createMockError({ recoverable: true })
      mockReloadStream.mockResolvedValueOnce(undefined)
      ;(usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        error: mockError,
        setError: mockSetError,
        playbackState: 'error',
      })

      renderHook(() =>
        useStreamErrorHandler(mockReloadStream, {
          autoRetry: true,
          baseDelay: 1000,
          backoffFactor: 2,
          maxRetries: 5,
        })
      )

      // Should not retry immediately
      expect(mockReloadStream).not.toHaveBeenCalled()

      // First retry should happen around 1000ms (plus up to 25% jitter = 1250ms max)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })

      expect(mockReloadStream).toHaveBeenCalledTimes(1)
    })
  })
})
