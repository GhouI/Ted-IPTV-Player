import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExitConfirmationDialog } from './ExitConfirmationDialog'
import { SpatialNavigationProvider } from './SpatialNavigationProvider'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SpatialNavigationProvider>{ui}</SpatialNavigationProvider>)
}

describe('ExitConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when isOpen is false', () => {
    renderWithProvider(
      <ExitConfirmationDialog {...defaultProps} isOpen={false} />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display the exit confirmation title', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(screen.getByText('Exit App?')).toBeInTheDocument()
  })

  it('should display the confirmation message', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(
      screen.getByText('Are you sure you want to exit Ted IPTV Player?')
    ).toBeInTheDocument()
  })

  it('should render Cancel button', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should render Exit button', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument()
  })

  it('should call onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn()
    renderWithProvider(
      <ExitConfirmationDialog {...defaultProps} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when Exit button is clicked', () => {
    const onConfirm = vi.fn()
    renderWithProvider(
      <ExitConfirmationDialog {...defaultProps} onConfirm={onConfirm} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn()
    renderWithProvider(
      <ExitConfirmationDialog {...defaultProps} onCancel={onCancel} />
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should have aria-modal attribute', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('should have aria-labelledby attribute pointing to title', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'exit-dialog-title')
    expect(document.getElementById('exit-dialog-title')).toHaveTextContent(
      'Exit App?'
    )
  })

  it('should not call onCancel for Escape when dialog is closed', () => {
    const onCancel = vi.fn()
    renderWithProvider(
      <ExitConfirmationDialog {...defaultProps} isOpen={false} onCancel={onCancel} />
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onCancel).not.toHaveBeenCalled()
  })

  it('should have proper backdrop styling', () => {
    renderWithProvider(<ExitConfirmationDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('fixed', 'inset-0', 'z-50')
  })
})
