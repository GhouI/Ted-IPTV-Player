import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { VODDetails } from './VODDetails'
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
  description: 'A test movie description that is long enough to be interesting.',
  categoryId: 'cat-1',
  streamUrl: 'http://example.com/movie.mp4',
  poster: 'http://example.com/poster.jpg',
  backdrop: 'http://example.com/backdrop.jpg',
  year: 2024,
  duration: 7200, // 2 hours
  genres: ['Action', 'Adventure', 'Sci-Fi'],
  directors: ['John Director'],
  cast: ['Actor One', 'Actor Two', 'Actor Three'],
  score: 8.5,
  rating: 'PG-13',
}

describe('VODDetails', () => {
  const defaultProps = {
    movie: mockMovie,
    isOpen: true,
    onClose: vi.fn(),
    onPlay: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering when open', () => {
    it('renders the modal when isOpen is true', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details')).toBeInTheDocument()
    })

    it('renders movie title', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
    })

    it('renders movie description', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText(/A test movie description/)).toBeInTheDocument()
    })

    it('renders year when available', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('renders duration when available', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('2h 0m')).toBeInTheDocument()
    })

    it('renders rating badge when available', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('PG-13')).toBeInTheDocument()
    })

    it('renders score when available', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('renders genres as tags', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Adventure')).toBeInTheDocument()
      expect(screen.getByText('Sci-Fi')).toBeInTheDocument()
    })

    it('renders cast members', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText(/Actor One/)).toBeInTheDocument()
      expect(screen.getByText(/Actor Two/)).toBeInTheDocument()
    })

    it('renders director', () => {
      render(<VODDetails {...defaultProps} />)
      expect(screen.getByText(/John Director/)).toBeInTheDocument()
    })

    it('renders play button', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-play-btn')).toBeInTheDocument()
      expect(screen.getByText('Play')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-close-btn')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  describe('rendering when closed', () => {
    it('does not render when isOpen is false', () => {
      render(<VODDetails {...defaultProps} isOpen={false} testId="vod-details" />)
      expect(screen.queryByTestId('vod-details')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onPlay when play button is clicked', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)

      fireEvent.click(screen.getByTestId('vod-details-play-btn'))
      expect(defaultProps.onPlay).toHaveBeenCalledWith(mockMovie)
    })

    it('calls onClose when close button is clicked', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)

      fireEvent.click(screen.getByTestId('vod-details-close-btn'))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)

      fireEvent.click(screen.getByTestId('vod-details-backdrop'))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Backspace key is pressed', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)

      fireEvent.keyDown(window, { key: 'Backspace' })
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details')).toHaveAttribute('role', 'dialog')
    })

    it('has aria-modal attribute', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details')).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details')).toHaveAttribute(
        'aria-labelledby',
        'vod-details-title'
      )
    })

    it('play button is focusable', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-play-btn')).toHaveAttribute('tabindex', '0')
    })

    it('close button is focusable', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-close-btn')).toHaveAttribute('tabindex', '0')
    })
  })

  describe('minimal movie data', () => {
    const minimalMovie: VODItem = {
      id: 'movie-minimal',
      title: 'Minimal Movie',
      categoryId: 'cat-1',
      streamUrl: 'http://example.com/movie.mp4',
    }

    it('renders with minimal data', () => {
      render(
        <VODDetails
          {...defaultProps}
          movie={minimalMovie}
          testId="vod-details"
        />
      )
      expect(screen.getByText('Minimal Movie')).toBeInTheDocument()
    })

    it('does not render year when not available', () => {
      render(
        <VODDetails
          {...defaultProps}
          movie={minimalMovie}
          testId="vod-details"
        />
      )
      expect(screen.queryByText('2024')).not.toBeInTheDocument()
    })

    it('does not render genres when not available', () => {
      render(
        <VODDetails
          {...defaultProps}
          movie={minimalMovie}
          testId="vod-details"
        />
      )
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
    })

    it('does not render cast when not available', () => {
      render(
        <VODDetails
          {...defaultProps}
          movie={minimalMovie}
          testId="vod-details"
        />
      )
      expect(screen.queryByText(/Cast:/)).not.toBeInTheDocument()
    })

    it('does not render director when not available', () => {
      render(
        <VODDetails
          {...defaultProps}
          movie={minimalMovie}
          testId="vod-details"
        />
      )
      expect(screen.queryByText(/Director:/)).not.toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details')).toBeInTheDocument()
    })

    it('applies testId to backdrop', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-backdrop')).toBeInTheDocument()
    })

    it('applies testId to buttons', () => {
      render(<VODDetails {...defaultProps} testId="vod-details" />)
      expect(screen.getByTestId('vod-details-play-btn')).toBeInTheDocument()
      expect(screen.getByTestId('vod-details-close-btn')).toBeInTheDocument()
    })
  })
})
