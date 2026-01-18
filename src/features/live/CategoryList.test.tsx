import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { CategoryList } from './CategoryList'
import type { Category } from '../../core/types/channel'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Sports' },
  { id: 'cat-2', name: 'News' },
  { id: 'cat-3', name: 'Entertainment' },
]

describe('CategoryList', () => {
  const defaultProps = {
    categories: mockCategories,
    selectedCategoryId: 'cat-1',
    onCategorySelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders all categories', () => {
      render(<CategoryList {...defaultProps} />)
      expect(screen.getByText('Sports')).toBeInTheDocument()
      expect(screen.getByText('News')).toBeInTheDocument()
      expect(screen.getByText('Entertainment')).toBeInTheDocument()
    })

    it('applies testId', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      expect(screen.getByTestId('category-list')).toBeInTheDocument()
    })

    it('applies testId to individual items', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      expect(screen.getByTestId('category-list-item-cat-1')).toBeInTheDocument()
      expect(screen.getByTestId('category-list-item-cat-2')).toBeInTheDocument()
      expect(screen.getByTestId('category-list-item-cat-3')).toBeInTheDocument()
    })

    it('shows empty message when no categories', () => {
      render(<CategoryList {...defaultProps} categories={[]} />)
      expect(screen.getByText('No categories available')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('marks selected category with data-selected', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      const selectedItem = screen.getByTestId('category-list-item-cat-1')
      expect(selectedItem).toHaveAttribute('data-selected', 'true')
    })

    it('marks non-selected categories with data-selected false', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      const nonSelectedItem = screen.getByTestId('category-list-item-cat-2')
      expect(nonSelectedItem).toHaveAttribute('data-selected', 'false')
    })

    it('handles null selectedCategoryId', () => {
      render(
        <CategoryList {...defaultProps} selectedCategoryId={null} testId="category-list" />
      )
      // All items should have data-selected="false"
      const item1 = screen.getByTestId('category-list-item-cat-1')
      const item2 = screen.getByTestId('category-list-item-cat-2')
      expect(item1).toHaveAttribute('data-selected', 'false')
      expect(item2).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('interaction', () => {
    it('calls onCategorySelect when category is clicked', async () => {
      const user = userEvent.setup()
      render(<CategoryList {...defaultProps} testId="category-list" />)

      await user.click(screen.getByTestId('category-list-item-cat-2'))
      expect(defaultProps.onCategorySelect).toHaveBeenCalledTimes(1)
      expect(defaultProps.onCategorySelect).toHaveBeenCalledWith(mockCategories[1])
    })

    it('handles missing onCategorySelect gracefully', async () => {
      const user = userEvent.setup()
      render(
        <CategoryList
          categories={mockCategories}
          selectedCategoryId="cat-1"
          testId="category-list"
        />
      )

      // Should not throw
      await user.click(screen.getByTestId('category-list-item-cat-2'))
    })
  })

  describe('accessibility', () => {
    it('has listbox role', () => {
      render(<CategoryList {...defaultProps} />)
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('has aria-label for navigation', () => {
      render(<CategoryList {...defaultProps} />)
      const nav = screen.getByRole('listbox')
      expect(nav).toHaveAttribute('aria-label', 'Channel categories')
    })

    it('category items have aria-selected attribute', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      const selectedItem = screen.getByTestId('category-list-item-cat-1')
      expect(selectedItem).toHaveAttribute('aria-selected', 'true')

      const nonSelectedItem = screen.getByTestId('category-list-item-cat-2')
      expect(nonSelectedItem).toHaveAttribute('aria-selected', 'false')
    })

    it('all category buttons are focusable', () => {
      render(<CategoryList {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('focus states', () => {
    it('sets data-focused attribute on items', () => {
      render(<CategoryList {...defaultProps} testId="category-list" />)
      const item = screen.getByTestId('category-list-item-cat-1')
      expect(item).toHaveAttribute('data-focused')
    })
  })
})
