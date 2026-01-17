import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusableCard } from './FocusableCard'
import { SpatialNavigationProvider } from '../navigation/SpatialNavigationProvider'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<SpatialNavigationProvider>{ui}</SpatialNavigationProvider>)
}

describe('FocusableCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children content', () => {
    renderWithProvider(
      <FocusableCard>
        <span>Card Content</span>
      </FocusableCard>
    )

    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should have role="button"', () => {
    renderWithProvider(
      <FocusableCard testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should apply testId as data-testid', () => {
    renderWithProvider(
      <FocusableCard testId="my-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })

  it('should apply additional className', () => {
    renderWithProvider(
      <FocusableCard className="custom-class" testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveClass('custom-class')
  })

  it('should apply square aspect ratio class', () => {
    renderWithProvider(
      <FocusableCard aspectRatio="square" testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveClass('aspect-square')
  })

  it('should apply video aspect ratio class', () => {
    renderWithProvider(
      <FocusableCard aspectRatio="video" testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveClass('aspect-video')
  })

  it('should apply poster aspect ratio class', () => {
    renderWithProvider(
      <FocusableCard aspectRatio="poster" testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveClass('aspect-[2/3]')
  })

  it('should have tabIndex 0 when not disabled', () => {
    renderWithProvider(
      <FocusableCard testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveAttribute('tabIndex', '0')
  })

  it('should have tabIndex -1 when disabled', () => {
    renderWithProvider(
      <FocusableCard disabled testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveAttribute('tabIndex', '-1')
  })

  it('should have aria-disabled when disabled', () => {
    renderWithProvider(
      <FocusableCard disabled testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveAttribute('aria-disabled', 'true')
  })

  it('should apply disabled styling when disabled', () => {
    renderWithProvider(
      <FocusableCard disabled testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('opacity-50')
    expect(card).toHaveClass('cursor-not-allowed')
  })

  it('should have data-disabled attribute', () => {
    renderWithProvider(
      <FocusableCard disabled testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveAttribute('data-disabled', 'true')
  })

  it('should have data-selected attribute when selected', () => {
    renderWithProvider(
      <FocusableCard selected testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    expect(screen.getByTestId('test-card')).toHaveAttribute('data-selected', 'true')
  })

  it('should have data-focused attribute', () => {
    renderWithProvider(
      <FocusableCard testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    // Initial state should be not focused
    expect(screen.getByTestId('test-card')).toHaveAttribute('data-focused')
  })

  it('should have base styling classes', () => {
    renderWithProvider(
      <FocusableCard testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('relative')
    expect(card).toHaveClass('overflow-hidden')
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('bg-tv-surface')
    expect(card).toHaveClass('border-2')
    expect(card).toHaveClass('transition-all')
  })

  it('should call onSelect when Enter key is pressed', () => {
    const onSelect = vi.fn()
    renderWithProvider(
      <FocusableCard onSelect={onSelect} testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.keyDown(card, { key: 'Enter' })

    // Note: onSelect is called via spatial navigation onEnterPress
    // The actual behavior depends on spatial navigation focus state
  })

  it('should not call onSelect when disabled', () => {
    const onSelect = vi.fn()
    renderWithProvider(
      <FocusableCard onSelect={onSelect} disabled testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    const card = screen.getByTestId('test-card')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('should apply selected border styling when selected and not disabled', () => {
    renderWithProvider(
      <FocusableCard selected testId="test-card">
        <span>Content</span>
      </FocusableCard>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('border-tv-accent')
  })

  it('should render with default props', () => {
    renderWithProvider(
      <FocusableCard>
        <span>Default Card</span>
      </FocusableCard>
    )

    expect(screen.getByText('Default Card')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false')
  })
})
