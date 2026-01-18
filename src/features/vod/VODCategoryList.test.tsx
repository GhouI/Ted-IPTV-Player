import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { VODCategoryList } from './VODCategoryList'
import type { VODCategory } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockCategories: VODCategory[] = [
  { id: 'cat-1', name: 'Action' },
  { id: 'cat-2', name: 'Comedy' },
  { id: 'cat-3', name: 'Drama' },
]

describe('VODCategoryList', () => {
  describe('rendering', () => {
    it('renders all categories', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
        />
      )

      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Comedy')).toBeInTheDocument()
      expect(screen.getByText('Drama')).toBeInTheDocument()
    })

    it('renders empty state when no categories', () => {
      render(
        <VODCategoryList
          categories={[]}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByText('No categories available')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('marks selected category with aria-selected', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId="cat-2"
          testId="category-list"
        />
      )

      const actionItem = screen.getByTestId('category-list-item-cat-1')
      const comedyItem = screen.getByTestId('category-list-item-cat-2')
      const dramaItem = screen.getByTestId('category-list-item-cat-3')

      expect(actionItem).toHaveAttribute('aria-selected', 'false')
      expect(comedyItem).toHaveAttribute('aria-selected', 'true')
      expect(dramaItem).toHaveAttribute('aria-selected', 'false')
    })

    it('marks selected category with data-selected', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId="cat-1"
          testId="category-list"
        />
      )

      const actionItem = screen.getByTestId('category-list-item-cat-1')
      expect(actionItem).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('interaction', () => {
    it('calls onCategorySelect when category is clicked', () => {
      const onCategorySelect = vi.fn()
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          onCategorySelect={onCategorySelect}
          testId="category-list"
        />
      )

      fireEvent.click(screen.getByTestId('category-list-item-cat-2'))
      expect(onCategorySelect).toHaveBeenCalledWith(mockCategories[1])
    })

    it('all category items are focusable', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByTestId('category-list-item-cat-1')).toHaveAttribute('tabindex', '0')
      expect(screen.getByTestId('category-list-item-cat-2')).toHaveAttribute('tabindex', '0')
      expect(screen.getByTestId('category-list-item-cat-3')).toHaveAttribute('tabindex', '0')
    })

    it('has data-focused attribute for spatial navigation', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByTestId('category-list-item-cat-1')).toHaveAttribute('data-focused')
      expect(screen.getByTestId('category-list-item-cat-2')).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has listbox role', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByTestId('category-list')).toHaveAttribute('role', 'listbox')
    })

    it('has aria-label', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByTestId('category-list')).toHaveAttribute(
        'aria-label',
        'Movie categories'
      )
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )
      expect(screen.getByTestId('category-list')).toBeInTheDocument()
    })

    it('applies testId to category items', () => {
      render(
        <VODCategoryList
          categories={mockCategories}
          selectedCategoryId={null}
          testId="category-list"
        />
      )

      expect(screen.getByTestId('category-list-item-cat-1')).toBeInTheDocument()
      expect(screen.getByTestId('category-list-item-cat-2')).toBeInTheDocument()
      expect(screen.getByTestId('category-list-item-cat-3')).toBeInTheDocument()
    })
  })
})
