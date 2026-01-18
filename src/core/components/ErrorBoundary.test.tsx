import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { ErrorBoundary } from './ErrorBoundary'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

// Suppress console.error for expected errors during tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalError
})

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="child-content">Content rendered successfully</div>
}

describe('ErrorBoundary', () => {
  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.queryByTestId('error-boundary-ui')).not.toBeInTheDocument()
    })
  })

  describe('when an error occurs', () => {
    it('renders the error recovery UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-boundary-ui')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    })

    it('displays Try Again and Reload buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-try-again-button')).toBeInTheDocument()
      expect(screen.getByTestId('error-reload-button')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Reload App')).toBeInTheDocument()
    })

    it('calls onError callback when error is caught', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      )
    })

    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('error-boundary-ui')).not.toBeInTheDocument()
    })

    it('shows error details when showDetails is true', () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument()
    })

    it('hides error details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.queryByText(/Error: Test error message/)).not.toBeInTheDocument()
    })
  })

  describe('recovery actions', () => {
    it('resets error state when Try Again is clicked', () => {
      let shouldThrow = true

      function ConditionalThrow() {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div data-testid="recovered-content">Recovered!</div>
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      // Verify error UI is shown
      expect(screen.getByTestId('error-boundary-ui')).toBeInTheDocument()

      // Fix the error condition
      shouldThrow = false

      // Click Try Again
      fireEvent.click(screen.getByTestId('error-try-again-button'))

      // Re-render to trigger state update
      rerender(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      )

      // Verify recovery
      expect(screen.getByTestId('recovered-content')).toBeInTheDocument()
      expect(screen.queryByTestId('error-boundary-ui')).not.toBeInTheDocument()
    })

    it('reloads the page when Reload App is clicked', () => {
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByTestId('error-reload-button'))

      expect(reloadMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('button focus states', () => {
    it('buttons have data-focused attribute', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByTestId('error-try-again-button')
      const reloadButton = screen.getByTestId('error-reload-button')

      expect(tryAgainButton).toHaveAttribute('data-focused')
      expect(reloadButton).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has accessible error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const icon = screen.getByTestId('error-boundary-ui').querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('buttons are clickable', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByTestId('error-try-again-button')
      const reloadButton = screen.getByTestId('error-reload-button')

      expect(tryAgainButton.tagName).toBe('BUTTON')
      expect(reloadButton.tagName).toBe('BUTTON')
    })
  })
})
