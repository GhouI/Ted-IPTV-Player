import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SeriesCard } from './SeriesCard'
import type { Series } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockSeries: Series = {
  id: 'series-1',
  title: 'Test Series',
  description: 'A test series description',
  categoryId: 'cat-1',
  poster: 'http://example.com/poster.jpg',
  year: 2024,
  genres: ['Drama', 'Thriller'],
  score: 8.5,
  rating: 'TV-MA',
  seasonCount: 3,
  episodeCount: 24,
}

describe('SeriesCard', () => {
  describe('rendering', () => {
    it('renders series title', () => {
      render(<SeriesCard series={mockSeries} />)
      expect(screen.getByText('Test Series')).toBeInTheDocument()
    })

    it('renders series poster when available', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      const img = screen.getByAltText('Test Series poster')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/poster.jpg')
    })

    it('renders initials when no poster', () => {
      const seriesWithoutPoster: Series = {
        ...mockSeries,
        poster: undefined,
      }
      render(<SeriesCard series={seriesWithoutPoster} />)
      expect(screen.getByText('TS')).toBeInTheDocument()
    })

    it('renders year badge when available', () => {
      render(<SeriesCard series={mockSeries} />)
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('renders rating score when available', () => {
      render(<SeriesCard series={mockSeries} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('renders season count badge when available', () => {
      render(<SeriesCard series={mockSeries} />)
      expect(screen.getByText('3 Seasons')).toBeInTheDocument()
    })

    it('renders singular Season for 1 season', () => {
      const seriesOneSeason: Series = {
        ...mockSeries,
        seasonCount: 1,
      }
      render(<SeriesCard series={seriesOneSeason} />)
      expect(screen.getByText('1 Season')).toBeInTheDocument()
    })

    it('renders genres when available', () => {
      render(<SeriesCard series={mockSeries} />)
      expect(screen.getByText('Drama, Thriller')).toBeInTheDocument()
    })

    it('does not render score badge when score is 0', () => {
      const seriesNoScore: Series = {
        ...mockSeries,
        score: 0,
      }
      render(<SeriesCard series={seriesNoScore} testId="series-card" />)
      expect(screen.queryByText('0.0')).not.toBeInTheDocument()
    })

    it('does not render season badge when seasonCount is 0', () => {
      const seriesNoSeasons: Series = {
        ...mockSeries,
        seasonCount: 0,
      }
      render(<SeriesCard series={seriesNoSeasons} testId="series-card" />)
      expect(screen.queryByText('0 Seasons')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(<SeriesCard series={mockSeries} onSelect={onSelect} testId="series-card" />)

      fireEvent.click(screen.getByTestId('series-card'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('has button role', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      expect(screen.getByTestId('series-card')).toHaveAttribute('role', 'button')
    })

    it('is focusable with tabindex', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      expect(screen.getByTestId('series-card')).toHaveAttribute('tabindex', '0')
    })

    it('has data-focused attribute for spatial navigation', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      expect(screen.getByTestId('series-card')).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has accessible aria-label with title', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      const card = screen.getByTestId('series-card')
      expect(card).toHaveAttribute('aria-label')
      expect(card.getAttribute('aria-label')).toContain('Test Series')
    })

    it('includes year in aria-label when available', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      const card = screen.getByTestId('series-card')
      expect(card.getAttribute('aria-label')).toContain('2024')
    })

    it('includes rating in aria-label when available', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      const card = screen.getByTestId('series-card')
      expect(card.getAttribute('aria-label')).toContain('8.5')
    })

    it('includes season count in aria-label when available', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      const card = screen.getByTestId('series-card')
      expect(card.getAttribute('aria-label')).toContain('3 seasons')
    })

    it('poster image has lazy loading', () => {
      render(<SeriesCard series={mockSeries} />)
      const img = screen.getByAltText('Test Series poster')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('image error handling', () => {
    it('shows initials when poster fails to load', () => {
      render(<SeriesCard series={mockSeries} />)
      const img = screen.getByAltText('Test Series poster')

      fireEvent.error(img)

      expect(screen.getByText('TS')).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<SeriesCard series={mockSeries} testId="series-card" />)
      expect(screen.getByTestId('series-card')).toBeInTheDocument()
    })
  })
})
