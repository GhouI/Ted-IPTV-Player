import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SeriesGrid } from './SeriesGrid'
import type { Series } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockSeriesList: Series[] = [
  {
    id: 'series-1',
    title: 'Series One',
    categoryId: 'cat-1',
    poster: 'http://example.com/poster1.jpg',
    year: 2024,
    seasonCount: 3,
  },
  {
    id: 'series-2',
    title: 'Series Two',
    categoryId: 'cat-1',
    poster: 'http://example.com/poster2.jpg',
    year: 2023,
    seasonCount: 2,
  },
  {
    id: 'series-3',
    title: 'Series Three',
    categoryId: 'cat-1',
    year: 2022,
    seasonCount: 1,
  },
]

describe('SeriesGrid', () => {
  describe('rendering', () => {
    it('renders all series', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)

      expect(screen.getByText('Series One')).toBeInTheDocument()
      expect(screen.getByText('Series Two')).toBeInTheDocument()
      expect(screen.getByText('Series Three')).toBeInTheDocument()
    })

    it('renders empty state when no series', () => {
      render(<SeriesGrid seriesList={[]} testId="series-grid" />)

      expect(screen.getByText('No series in this category')).toBeInTheDocument()
    })

    it('applies grid classes', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveClass('grid')
    })
  })

  describe('column configuration', () => {
    it('uses 5 columns by default', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveClass('grid-cols-5')
    })

    it('can be configured to use 4 columns', () => {
      render(<SeriesGrid seriesList={mockSeriesList} columns={4} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveClass('grid-cols-4')
    })

    it('can be configured to use 6 columns', () => {
      render(<SeriesGrid seriesList={mockSeriesList} columns={6} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveClass('grid-cols-6')
    })

    it('can be configured to use 7 columns', () => {
      render(<SeriesGrid seriesList={mockSeriesList} columns={7} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveClass('grid-cols-7')
    })
  })

  describe('interaction', () => {
    it('calls onSeriesSelect when a series is clicked', () => {
      const onSeriesSelect = vi.fn()
      render(
        <SeriesGrid
          seriesList={mockSeriesList}
          onSeriesSelect={onSeriesSelect}
          testId="series-grid"
        />
      )

      fireEvent.click(screen.getByTestId('series-grid-series-series-1'))
      expect(onSeriesSelect).toHaveBeenCalledWith(mockSeriesList[0])
    })

    it('calls onSeriesSelect with correct series', () => {
      const onSeriesSelect = vi.fn()
      render(
        <SeriesGrid
          seriesList={mockSeriesList}
          onSeriesSelect={onSeriesSelect}
          testId="series-grid"
        />
      )

      fireEvent.click(screen.getByTestId('series-grid-series-series-2'))
      expect(onSeriesSelect).toHaveBeenCalledWith(mockSeriesList[1])
    })
  })

  describe('accessibility', () => {
    it('has grid role', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveAttribute('role', 'grid')
    })

    it('has aria-label', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)
      const grid = screen.getByTestId('series-grid')

      expect(grid).toHaveAttribute('aria-label', 'Series grid')
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)
      expect(screen.getByTestId('series-grid')).toBeInTheDocument()
    })

    it('applies testId to series cards', () => {
      render(<SeriesGrid seriesList={mockSeriesList} testId="series-grid" />)

      expect(screen.getByTestId('series-grid-series-series-1')).toBeInTheDocument()
      expect(screen.getByTestId('series-grid-series-series-2')).toBeInTheDocument()
      expect(screen.getByTestId('series-grid-series-series-3')).toBeInTheDocument()
    })
  })
})
