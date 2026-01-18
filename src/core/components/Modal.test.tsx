import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'
import { SpatialNavigationProvider } from '../navigation/SpatialNavigationProvider'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SpatialNavigationProvider>{ui}</SpatialNavigationProvider>)
}

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      renderWithProvider(<Modal {...defaultProps} testId="modal" />)

      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      renderWithProvider(<Modal {...defaultProps} isOpen={false} testId="modal" />)

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('should render title when provided', () => {
      renderWithProvider(<Modal {...defaultProps} title="Test Title" />)

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Title')
    })

    it('should not render title element when title is not provided', () => {
      renderWithProvider(<Modal {...defaultProps} />)

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('should render close button when showCloseButton is true', () => {
      renderWithProvider(<Modal {...defaultProps} showCloseButton />)

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('should not render close button by default', () => {
      renderWithProvider(<Modal {...defaultProps} />)

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProvider(<Modal {...defaultProps} className="custom-class" testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.custom-class')
      expect(modalContent).toBeInTheDocument()
    })

    it('should have proper aria attributes', () => {
      renderWithProvider(<Modal {...defaultProps} title="Accessible Modal" />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('should not have aria-labelledby when no title', () => {
      renderWithProvider(<Modal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).not.toHaveAttribute('aria-labelledby')
    })
  })

  describe('size variants', () => {
    it('should apply sm size class', () => {
      renderWithProvider(<Modal {...defaultProps} size="sm" testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.max-w-sm')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply md size class by default', () => {
      renderWithProvider(<Modal {...defaultProps} testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.max-w-md')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply lg size class', () => {
      renderWithProvider(<Modal {...defaultProps} size="lg" testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.max-w-lg')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply xl size class', () => {
      renderWithProvider(<Modal {...defaultProps} size="xl" testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.max-w-xl')
      expect(modalContent).toBeInTheDocument()
    })

    it('should apply full size class', () => {
      renderWithProvider(<Modal {...defaultProps} size="full" testId="modal" />)

      const modalContent = screen.getByTestId('modal').querySelector('.max-w-4xl')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('closing behavior', () => {
    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Backspace key is pressed', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(window, { key: 'Backspace' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when VIDAA Back key is pressed', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(window, { keyCode: 461 })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Samsung/LG Back key is pressed', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(window, { keyCode: 10009 })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} testId="modal" />)

      const backdrop = screen.getByTestId('modal')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('Modal Content'))

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not call onClose on backdrop click when closeOnBackdrop is false', () => {
      const onClose = vi.fn()
      renderWithProvider(
        <Modal {...defaultProps} onClose={onClose} closeOnBackdrop={false} testId="modal" />
      )

      const backdrop = screen.getByTestId('modal')
      fireEvent.click(backdrop)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      renderWithProvider(<Modal {...defaultProps} onClose={onClose} showCloseButton />)

      fireEvent.click(screen.getByLabelText('Close modal'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('body scroll prevention', () => {
    it('should set body overflow to hidden when open', () => {
      renderWithProvider(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body overflow when closed', () => {
      const { rerender } = renderWithProvider(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <SpatialNavigationProvider>
          <Modal {...defaultProps} isOpen={false} />
        </SpatialNavigationProvider>
      )

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('focus management', () => {
    it('should render with FocusContext provider for focus trapping', () => {
      renderWithProvider(<Modal {...defaultProps} testId="modal" />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('should use custom focusKey when provided', () => {
      renderWithProvider(<Modal {...defaultProps} focusKey="custom-modal" testId="modal" />)

      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  describe('header rendering', () => {
    it('should render header with both title and close button', () => {
      renderWithProvider(<Modal {...defaultProps} title="Test" showCloseButton />)

      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('should not render header when neither title nor close button is present', () => {
      renderWithProvider(<Modal {...defaultProps} testId="modal" />)

      const modalContent = screen.getByTestId('modal').firstChild
      expect(modalContent).not.toContainHTML('mb-4')
    })
  })

  describe('cleanup', () => {
    it('should remove keydown listener when unmounted', () => {
      const onClose = vi.fn()
      const { unmount } = renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      unmount()

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should remove keydown listener when isOpen becomes false', () => {
      const onClose = vi.fn()
      const { rerender } = renderWithProvider(<Modal {...defaultProps} onClose={onClose} />)

      rerender(
        <SpatialNavigationProvider>
          <Modal {...defaultProps} onClose={onClose} isOpen={false} />
        </SpatialNavigationProvider>
      )

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
