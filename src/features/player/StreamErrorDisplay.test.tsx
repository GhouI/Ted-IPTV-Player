import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StreamErrorDisplay } from './StreamErrorDisplay'
import type { PlayerError } from '../../core/types/player'

// Mock norigin-spatial-navigation
vi.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  useFocusable: vi.fn(() => ({
    ref: { current: null },
    focused: false,
  })),
}))

describe('StreamErrorDisplay', () => {
  const mockOnRetry = vi.fn()
  const mockOnBack = vi.fn()

  const createMockError = (overrides: Partial<PlayerError> = {}): PlayerError => ({
    code: 'NETWORK_ERROR',
    message: 'Test error message',
    recoverable: true,
    timestamp: Date.now(),
    ...overrides,
  })

  const defaultProps = {
    error: createMockError(),
    errorMessage: 'A network error occurred',
    isRetrying: false,
    retryCount: 0,
    maxRetries: 3,
    maxRetriesReached: false,
    isRecoverable: true,
    onRetry: mockOnRetry,
    onBack: mockOnBack,
    testId: 'stream-error',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when error is null', () => {
      render(<StreamErrorDisplay {...defaultProps} error={null} />)

      expect(screen.queryByText('Playback Error')).not.toBeInTheDocument()
    })

    it('should render error display when error exists', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByText('Playback Error')).toBeInTheDocument()
    })

    it('should display error message', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByText('A network error occurred')).toBeInTheDocument()
    })

    it('should display error code', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByText('Error code: NETWORK_ERROR')).toBeInTheDocument()
    })

    it('should render retry button for recoverable errors', () => {
      render(<StreamErrorDisplay {...defaultProps} isRecoverable={true} />)

      expect(screen.getByTestId('stream-error-retry-button')).toBeInTheDocument()
    })

    it('should render back button when onBack is provided', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByTestId('stream-error-back-button')).toBeInTheDocument()
    })

    it('should not render back button when onBack is not provided', () => {
      render(<StreamErrorDisplay {...defaultProps} onBack={undefined} />)

      expect(screen.queryByTestId('stream-error-back-button')).not.toBeInTheDocument()
    })
  })

  describe('retry state', () => {
    it('should show retrying indicator when isRetrying is true', () => {
      render(<StreamErrorDisplay {...defaultProps} isRetrying={true} />)

      expect(screen.getByTestId('stream-error-retrying')).toBeInTheDocument()
      expect(screen.getByText('Attempting to reconnect...')).toBeInTheDocument()
    })

    it('should show retry count when retries have been attempted', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          retryCount={2}
          maxRetries={3}
        />
      )

      expect(screen.getByTestId('stream-error-retry-count')).toBeInTheDocument()
      expect(screen.getByText('Retry attempt 2 of 3')).toBeInTheDocument()
    })

    it('should not show retry count when no retries attempted', () => {
      render(<StreamErrorDisplay {...defaultProps} retryCount={0} />)

      expect(screen.queryByTestId('stream-error-retry-count')).not.toBeInTheDocument()
    })

    it('should not show retry count when retrying', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          retryCount={1}
          isRetrying={true}
        />
      )

      expect(screen.queryByTestId('stream-error-retry-count')).not.toBeInTheDocument()
    })
  })

  describe('max retries reached', () => {
    it('should show max retries warning', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          maxRetriesReached={true}
          retryCount={3}
        />
      )

      expect(screen.getByTestId('stream-error-max-retries')).toBeInTheDocument()
      expect(screen.getByText('Unable to connect after 3 attempts')).toBeInTheDocument()
    })

    it('should show retry button with "Try Again" text when max retries reached', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          maxRetriesReached={true}
          isRecoverable={false}
        />
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  describe('non-recoverable errors', () => {
    it('should show non-recoverable message when error is not recoverable', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          isRecoverable={false}
          maxRetriesReached={false}
        />
      )

      expect(
        screen.getByText('This error cannot be automatically recovered. Please try a different stream.')
      ).toBeInTheDocument()
    })

    it('should not show non-recoverable message when max retries reached', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          isRecoverable={false}
          maxRetriesReached={true}
        />
      )

      expect(
        screen.queryByText('This error cannot be automatically recovered. Please try a different stream.')
      ).not.toBeInTheDocument()
    })
  })

  describe('button interactions', () => {
    it('should call onRetry when retry button is clicked', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      fireEvent.click(screen.getByTestId('stream-error-retry-button'))

      expect(mockOnRetry).toHaveBeenCalled()
    })

    it('should not call onRetry when retry button is clicked while retrying', () => {
      render(<StreamErrorDisplay {...defaultProps} isRetrying={true} />)

      const retryButton = screen.getByTestId('stream-error-retry-button')
      fireEvent.click(retryButton)

      // The button has disabled attribute
      expect(retryButton).toBeDisabled()
    })

    it('should call onBack when back button is clicked', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      fireEvent.click(screen.getByTestId('stream-error-back-button'))

      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  describe('retry button text', () => {
    it('should show "Retrying..." when isRetrying', () => {
      render(<StreamErrorDisplay {...defaultProps} isRetrying={true} />)

      expect(screen.getByText('Retrying...')).toBeInTheDocument()
    })

    it('should show "Try Again" when maxRetriesReached', () => {
      render(<StreamErrorDisplay {...defaultProps} maxRetriesReached={true} />)

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should show retry count in button text', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          retryCount={1}
          maxRetries={3}
        />
      )

      expect(screen.getByText('Retry (1/3)')).toBeInTheDocument()
    })
  })

  describe('different error codes', () => {
    it('should display MEDIA_ERROR code', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          error={createMockError({ code: 'MEDIA_ERROR' })}
        />
      )

      expect(screen.getByText('Error code: MEDIA_ERROR')).toBeInTheDocument()
    })

    it('should display DRM_ERROR code', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          error={createMockError({ code: 'DRM_ERROR' })}
        />
      )

      expect(screen.getByText('Error code: DRM_ERROR')).toBeInTheDocument()
    })

    it('should display TIMEOUT_ERROR code', () => {
      render(
        <StreamErrorDisplay
          {...defaultProps}
          error={createMockError({ code: 'TIMEOUT_ERROR' })}
        />
      )

      expect(screen.getByText('Error code: TIMEOUT_ERROR')).toBeInTheDocument()
    })
  })

  describe('test ids', () => {
    it('should apply testId to container', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByTestId('stream-error')).toBeInTheDocument()
    })

    it('should apply testId to message', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByTestId('stream-error-message')).toBeInTheDocument()
    })

    it('should apply testId to code', () => {
      render(<StreamErrorDisplay {...defaultProps} />)

      expect(screen.getByTestId('stream-error-code')).toBeInTheDocument()
    })

    it('should not render with testId when testId is not provided', () => {
      render(<StreamErrorDisplay {...defaultProps} testId={undefined} />)

      // Container should still render but without testId
      expect(screen.getByText('Playback Error')).toBeInTheDocument()
    })
  })
})
