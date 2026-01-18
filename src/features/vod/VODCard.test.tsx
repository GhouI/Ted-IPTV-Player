import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { VODCard } from './VODCard'
import type { VODItem } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockMovie: VODItem = {
  id: 'movie-1',
  title: 'Test Movie',
  description: 'A test movie description',
  categoryId: 'cat-1',
  streamUrl: 'http://example.com/movie.mp4',
  poster: 'http://example.com/poster.jpg',
  year: 2024,
  duration: 7200, // 2 hours
  genres: ['Action', 'Adventure'],
  score: 8.5,
  rating: 'PG-13',
}

describe('VODCard', () => {
  describe('rendering', () => {
    it('renders movie title', () => {
      render(<VODCard movie={mockMovie} />)
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
    })

    it('renders movie poster when available', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      const img = screen.getByAltText('Test Movie poster')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/poster.jpg')
    })

    it('renders initials when no poster', () => {
      const movieWithoutPoster: VODItem = {
        ...mockMovie,
        poster: undefined,
      }
      render(<VODCard movie={movieWithoutPoster} />)
      expect(screen.getByText('TM')).toBeInTheDocument()
    })

    it('renders year badge when available', () => {
      render(<VODCard movie={mockMovie} />)
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('renders rating score when available', () => {
      render(<VODCard movie={mockMovie} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('renders duration badge when available', () => {
      render(<VODCard movie={mockMovie} />)
      expect(screen.getByText('2h 0m')).toBeInTheDocument()
    })

    it('renders genres when available', () => {
      render(<VODCard movie={mockMovie} />)
      expect(screen.getByText('Action, Adventure')).toBeInTheDocument()
    })

    it('does not render score badge when score is 0', () => {
      const movieNoScore: VODItem = {
        ...mockMovie,
        score: 0,
      }
      render(<VODCard movie={movieNoScore} testId="vod-card" />)
      expect(screen.queryByText('0.0')).not.toBeInTheDocument()
    })

    it('does not render duration badge when duration is 0', () => {
      const movieNoDuration: VODItem = {
        ...mockMovie,
        duration: 0,
      }
      render(<VODCard movie={movieNoDuration} testId="vod-card" />)
      expect(screen.queryByText('0m')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(<VODCard movie={mockMovie} onSelect={onSelect} testId="vod-card" />)

      fireEvent.click(screen.getByTestId('vod-card'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('has button role', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      expect(screen.getByTestId('vod-card')).toHaveAttribute('role', 'button')
    })

    it('is focusable with tabindex', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      expect(screen.getByTestId('vod-card')).toHaveAttribute('tabindex', '0')
    })

    it('has data-focused attribute for spatial navigation', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      expect(screen.getByTestId('vod-card')).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('has accessible aria-label with title', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      const card = screen.getByTestId('vod-card')
      expect(card).toHaveAttribute('aria-label')
      expect(card.getAttribute('aria-label')).toContain('Test Movie')
    })

    it('includes year in aria-label when available', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      const card = screen.getByTestId('vod-card')
      expect(card.getAttribute('aria-label')).toContain('2024')
    })

    it('includes rating in aria-label when available', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      const card = screen.getByTestId('vod-card')
      expect(card.getAttribute('aria-label')).toContain('8.5')
    })

    it('poster image has lazy loading', () => {
      render(<VODCard movie={mockMovie} />)
      const img = screen.getByAltText('Test Movie poster')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('image error handling', () => {
    it('shows initials when poster fails to load', () => {
      render(<VODCard movie={mockMovie} />)
      const img = screen.getByAltText('Test Movie poster')

      fireEvent.error(img)

      expect(screen.getByText('TM')).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<VODCard movie={mockMovie} testId="vod-card" />)
      expect(screen.getByTestId('vod-card')).toBeInTheDocument()
    })
  })

  describe('duration formatting', () => {
    it('formats hours and minutes correctly', () => {
      const movieWithDuration: VODItem = {
        ...mockMovie,
        duration: 5400, // 1h 30m
      }
      render(<VODCard movie={movieWithDuration} />)
      expect(screen.getByText('1h 30m')).toBeInTheDocument()
    })

    it('formats minutes only when less than an hour', () => {
      const movieWithDuration: VODItem = {
        ...mockMovie,
        duration: 2700, // 45m
      }
      render(<VODCard movie={movieWithDuration} />)
      expect(screen.getByText('45m')).toBeInTheDocument()
    })
  })
})
