import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { VODGrid } from './VODGrid'
import type { VODItem } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockMovies: VODItem[] = [
  {
    id: 'movie-1',
    title: 'Movie One',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/movie1.mp4',
    poster: 'http://example.com/poster1.jpg',
    year: 2024,
  },
  {
    id: 'movie-2',
    title: 'Movie Two',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/movie2.mp4',
    poster: 'http://example.com/poster2.jpg',
    year: 2023,
  },
  {
    id: 'movie-3',
    title: 'Movie Three',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/movie3.mp4',
    year: 2022,
  },
]

describe('VODGrid', () => {
  describe('rendering', () => {
    it('renders all movies', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)

      expect(screen.getByText('Movie One')).toBeInTheDocument()
      expect(screen.getByText('Movie Two')).toBeInTheDocument()
      expect(screen.getByText('Movie Three')).toBeInTheDocument()
    })

    it('renders empty state when no movies', () => {
      render(<VODGrid movies={[]} testId="vod-grid" />)

      expect(screen.getByText('No movies in this category')).toBeInTheDocument()
    })

    it('applies grid classes', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveClass('grid')
    })
  })

  describe('column configuration', () => {
    it('uses 5 columns by default', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveClass('grid-cols-5')
    })

    it('can be configured to use 4 columns', () => {
      render(<VODGrid movies={mockMovies} columns={4} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveClass('grid-cols-4')
    })

    it('can be configured to use 6 columns', () => {
      render(<VODGrid movies={mockMovies} columns={6} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveClass('grid-cols-6')
    })

    it('can be configured to use 7 columns', () => {
      render(<VODGrid movies={mockMovies} columns={7} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveClass('grid-cols-7')
    })
  })

  describe('interaction', () => {
    it('calls onMovieSelect when a movie is clicked', () => {
      const onMovieSelect = vi.fn()
      render(
        <VODGrid
          movies={mockMovies}
          onMovieSelect={onMovieSelect}
          testId="vod-grid"
        />
      )

      fireEvent.click(screen.getByTestId('vod-grid-movie-movie-1'))
      expect(onMovieSelect).toHaveBeenCalledWith(mockMovies[0])
    })

    it('calls onMovieSelect with correct movie', () => {
      const onMovieSelect = vi.fn()
      render(
        <VODGrid
          movies={mockMovies}
          onMovieSelect={onMovieSelect}
          testId="vod-grid"
        />
      )

      fireEvent.click(screen.getByTestId('vod-grid-movie-movie-2'))
      expect(onMovieSelect).toHaveBeenCalledWith(mockMovies[1])
    })
  })

  describe('accessibility', () => {
    it('has grid role', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveAttribute('role', 'grid')
    })

    it('has aria-label', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)
      const grid = screen.getByTestId('vod-grid')

      expect(grid).toHaveAttribute('aria-label', 'Movies grid')
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)
      expect(screen.getByTestId('vod-grid')).toBeInTheDocument()
    })

    it('applies testId to movie cards', () => {
      render(<VODGrid movies={mockMovies} testId="vod-grid" />)

      expect(screen.getByTestId('vod-grid-movie-movie-1')).toBeInTheDocument()
      expect(screen.getByTestId('vod-grid-movie-movie-2')).toBeInTheDocument()
      expect(screen.getByTestId('vod-grid-movie-movie-3')).toBeInTheDocument()
    })
  })
})
