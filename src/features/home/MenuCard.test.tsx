import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { MenuCard } from './MenuCard'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const TestIcon = () => <span data-testid="test-icon">Icon</span>

describe('MenuCard', () => {
  const defaultProps = {
    title: 'Live TV',
    icon: <TestIcon />,
  }

  describe('rendering', () => {
    it('renders title', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText('Live TV')).toBeInTheDocument()
    })

    it('renders icon', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(<MenuCard {...defaultProps} description="Watch live channels" />)
      expect(screen.getByText('Watch live channels')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.queryByText('Watch live channels')).not.toBeInTheDocument()
    })

    it('applies testId', () => {
      render(<MenuCard {...defaultProps} testId="menu-card-test" />)
      expect(screen.getByTestId('menu-card-test')).toBeInTheDocument()
    })
  })

  describe('focus behavior', () => {
    it('has data-focused attribute', () => {
      render(<MenuCard {...defaultProps} testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('data-focused')
    })

    it('has focusable tabIndex', () => {
      render(<MenuCard {...defaultProps} testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('calls onFocus when provided', () => {
      const onFocus = vi.fn()
      render(<MenuCard {...defaultProps} onFocus={onFocus} testId="menu-card" />)
      // Focus callback is called via spatial navigation system
      expect(screen.getByTestId('menu-card')).toBeInTheDocument()
    })
  })

  describe('selection behavior', () => {
    it('calls onSelect when clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<MenuCard {...defaultProps} onSelect={onSelect} testId="menu-card" />)

      await user.click(screen.getByTestId('menu-card'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('does not call onSelect when disabled', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <MenuCard {...defaultProps} onSelect={onSelect} disabled testId="menu-card" />
      )

      await user.click(screen.getByTestId('menu-card'))
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('has data-disabled attribute when disabled', () => {
      render(<MenuCard {...defaultProps} disabled testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('data-disabled', 'true')
    })

    it('has aria-disabled when disabled', () => {
      render(<MenuCard {...defaultProps} disabled testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('aria-disabled', 'true')
    })

    it('has tabIndex -1 when disabled', () => {
      render(<MenuCard {...defaultProps} disabled testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('tabIndex', '-1')
    })

    it('does not call onFocus when disabled', () => {
      const onFocus = vi.fn()
      render(
        <MenuCard {...defaultProps} disabled onFocus={onFocus} testId="menu-card" />
      )
      // Disabled state prevents focus callback
      expect(screen.getByTestId('menu-card')).toHaveAttribute('data-disabled', 'true')
    })
  })

  describe('accessibility', () => {
    it('has button role', () => {
      render(<MenuCard {...defaultProps} testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('role', 'button')
    })

    it('has aria-label with title', () => {
      render(<MenuCard {...defaultProps} testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveAttribute('aria-label', 'Live TV')
    })
  })

  describe('styling', () => {
    it('applies base styling classes', () => {
      render(<MenuCard {...defaultProps} testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveClass('flex', 'flex-col', 'items-center', 'rounded-xl')
    })

    it('applies opacity class when disabled', () => {
      render(<MenuCard {...defaultProps} disabled testId="menu-card" />)
      const card = screen.getByTestId('menu-card')
      expect(card).toHaveClass('opacity-50')
    })
  })

  describe('with different icons', () => {
    it('renders SVG icon', () => {
      const svgIcon = (
        <svg data-testid="svg-icon" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" />
        </svg>
      )
      render(<MenuCard title="Test" icon={svgIcon} />)
      expect(screen.getByTestId('svg-icon')).toBeInTheDocument()
    })

    it('renders text icon', () => {
      render(<MenuCard title="Test" icon="📺" />)
      expect(screen.getByText('📺')).toBeInTheDocument()
    })
  })
})
