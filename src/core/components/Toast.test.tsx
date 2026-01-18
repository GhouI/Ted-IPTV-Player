import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast, type ToastType } from './Toast'

// Helper component to trigger toasts in tests
function ToastTrigger({
  message,
  type,
  duration,
}: {
  message: string
  type?: ToastType
  duration?: number
}) {
  const { addToast, removeToast, clearToasts, toasts } = useToast()
  return (
    <div>
      <button onClick={() => addToast(message, type, duration)} data-testid="add-toast">
        Add Toast
      </button>
      <button onClick={() => toasts[0] && removeToast(toasts[0].id)} data-testid="remove-toast">
        Remove Toast
      </button>
      <button onClick={clearToasts} data-testid="clear-toasts">
        Clear Toasts
      </button>
      <span data-testid="toast-count">{toasts.length}</span>
    </div>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('ToastProvider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child Content</div>
        </ToastProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should not render toast container when no toasts', () => {
      render(
        <ToastProvider testId="toast-container">
          <div>Content</div>
        </ToastProvider>
      )

      expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument()
    })

    it('should render toast container with testId when toasts exist', async () => {
      render(
        <ToastProvider testId="toast-container">
          <ToastTrigger message="Test message" />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getByTestId('toast-container')).toBeInTheDocument()
    })
  })

  describe('useToast hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<ToastTrigger message="Test" />)
      }).toThrow('useToast must be used within a ToastProvider')

      consoleSpy.mockRestore()
    })

    it('should add a toast', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Test message" />
        </ToastProvider>
      )

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('add-toast'))

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1')
    })

    it('should remove a toast', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Test message" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1')

      fireEvent.click(screen.getByTestId('remove-toast'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })

    it('should clear all toasts', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Test message" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('3')

      fireEvent.click(screen.getByTestId('clear-toasts'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })
  })

  describe('toast types', () => {
    it.each<ToastType>(['info', 'success', 'warning', 'error'])(
      'should render %s toast with correct styling',
      async (type) => {
        render(
          <ToastProvider>
            <ToastTrigger message={`${type} message`} type={type} duration={0} />
          </ToastProvider>
        )

        fireEvent.click(screen.getByTestId('add-toast'))
        await act(async () => {
          vi.advanceTimersByTime(20)
        })

        const toast = screen.getByRole('alert')
        expect(toast).toHaveAttribute('data-type', type)
        expect(toast).toHaveTextContent(`${type} message`)
      }
    )

    it('should default to info type', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Default toast" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getByRole('alert')).toHaveAttribute('data-type', 'info')
    })
  })

  describe('auto-dismiss', () => {
    it('should auto-dismiss after default duration', async () => {
      render(
        <ToastProvider defaultDuration={3000}>
          <ToastTrigger message="Auto dismiss" />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1')

      await act(async () => {
        vi.advanceTimersByTime(3000)
      })

      await act(async () => {
        vi.advanceTimersByTime(200) // Animation duration
      })

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })

    it('should auto-dismiss after custom duration', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Custom duration" duration={1000} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1')

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })

    it('should not auto-dismiss when duration is 0', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="No auto dismiss" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))

      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1')
    })
  })

  describe('manual dismiss', () => {
    it('should dismiss when clicking close button', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Dismissable" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      const closeButton = screen.getByLabelText('Dismiss notification')
      fireEvent.click(closeButton)

      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0')
    })
  })

  describe('max toasts limit', () => {
    it('should respect maxToasts limit', async () => {
      render(
        <ToastProvider maxToasts={3}>
          <ToastTrigger message="Toast" duration={0} />
        </ToastProvider>
      )

      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId('add-toast'))
      }

      expect(screen.getByTestId('toast-count')).toHaveTextContent('3')
    })

    it('should remove oldest toasts when exceeding limit', async () => {
      let toastNumber = 0
      function NumberedToastTrigger() {
        const { addToast, toasts } = useToast()
        return (
          <div>
            <button
              onClick={() => addToast(`Toast ${++toastNumber}`, 'info', 0)}
              data-testid="add-toast"
            >
              Add
            </button>
            <span data-testid="toast-count">{toasts.length}</span>
          </div>
        )
      }

      render(
        <ToastProvider maxToasts={2}>
          <NumberedToastTrigger />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))

      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(2)
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
      expect(screen.getByText('Toast 2')).toBeInTheDocument()
      expect(screen.getByText('Toast 3')).toBeInTheDocument()
    })
  })

  describe('positioning', () => {
    it.each([
      ['top-right', 'top-4 right-4'],
      ['top-left', 'top-4 left-4'],
      ['bottom-right', 'bottom-4 right-4'],
      ['bottom-left', 'bottom-4 left-4'],
      ['top-center', 'top-4 left-1/2'],
      ['bottom-center', 'bottom-4 left-1/2'],
    ] as const)('should apply %s position classes', async (position, expectedClass) => {
      render(
        <ToastProvider position={position} testId="toast-container">
          <ToastTrigger message="Positioned toast" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      const container = screen.getByTestId('toast-container')
      expectedClass.split(' ').forEach((cls) => {
        expect(container.className).toContain(cls)
      })
    })
  })

  describe('accessibility', () => {
    it('should have role="alert" on toast items', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Accessible toast" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have role="region" on toast container', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Test" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Notifications')
    })

    it('should have accessible dismiss button', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Test" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument()
    })
  })

  describe('animations', () => {
    it('should start with opacity-0 and transition to opacity-100', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Animated" duration={0} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))

      // Initially not visible
      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('opacity-0')

      // After animation tick
      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(toast.className).toContain('opacity-100')
    })

    it('should transition to opacity-0 when exiting', async () => {
      render(
        <ToastProvider>
          <ToastTrigger message="Exiting" duration={1000} />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))

      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      const toast = screen.getByRole('alert')
      expect(toast.className).toContain('opacity-100')

      // Trigger exit
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(toast.className).toContain('opacity-0')
    })
  })

  describe('multiple toasts', () => {
    it('should render multiple toasts', async () => {
      let counter = 0
      function MultiToastTrigger() {
        const { addToast } = useToast()
        return (
          <button
            onClick={() => addToast(`Toast ${++counter}`, 'info', 0)}
            data-testid="add-toast"
          >
            Add
          </button>
        )
      }

      render(
        <ToastProvider>
          <MultiToastTrigger />
        </ToastProvider>
      )

      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))
      fireEvent.click(screen.getByTestId('add-toast'))

      await act(async () => {
        vi.advanceTimersByTime(20)
      })

      expect(screen.getAllByRole('alert')).toHaveLength(3)
    })
  })
})
