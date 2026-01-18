import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { EpisodeList, EpisodeCard } from './EpisodeList'
import type { Episode } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockEpisodes: Episode[] = [
  {
    id: 'ep-1',
    seriesId: 'series-1',
    seasonId: 'season-1',
    seasonNumber: 1,
    episodeNumber: 1,
    title: 'Pilot',
    description: 'The first episode of the series.',
    streamUrl: 'http://example.com/stream1.m3u8',
    thumbnail: 'http://example.com/thumb1.jpg',
    duration: 3600,
  },
  {
    id: 'ep-2',
    seriesId: 'series-1',
    seasonId: 'season-1',
    seasonNumber: 1,
    episodeNumber: 2,
    title: 'The Second One',
    description: 'Things get interesting.',
    streamUrl: 'http://example.com/stream2.m3u8',
    duration: 2700,
  },
  {
    id: 'ep-3',
    seriesId: 'series-1',
    seasonId: 'season-1',
    seasonNumber: 1,
    episodeNumber: 3,
    title: 'Episode Three',
    streamUrl: 'http://example.com/stream3.m3u8',
  },
]

describe('EpisodeList', () => {
  describe('rendering', () => {
    it('renders all episodes', () => {
      render(
        <EpisodeList
          episodes={mockEpisodes}
          onEpisodeSelect={vi.fn()}
        />
      )
      expect(screen.getByText('Pilot')).toBeInTheDocument()
      expect(screen.getByText('The Second One')).toBeInTheDocument()
      expect(screen.getByText('Episode Three')).toBeInTheDocument()
    })

    it('displays empty state when no episodes', () => {
      render(
        <EpisodeList
          episodes={[]}
          onEpisodeSelect={vi.fn()}
          testId="episode-list"
        />
      )
      expect(screen.getByText('No episodes available for this season.')).toBeInTheDocument()
    })

    it('applies testId to container', () => {
      render(
        <EpisodeList
          episodes={mockEpisodes}
          onEpisodeSelect={vi.fn()}
          testId="episode-list"
        />
      )
      expect(screen.getByTestId('episode-list')).toBeInTheDocument()
    })

    it('has list role for accessibility', () => {
      render(
        <EpisodeList
          episodes={mockEpisodes}
          onEpisodeSelect={vi.fn()}
          testId="episode-list"
        />
      )
      expect(screen.getByTestId('episode-list')).toHaveAttribute('role', 'list')
    })
  })

  describe('interaction', () => {
    it('calls onEpisodeSelect when an episode is clicked', () => {
      const onEpisodeSelect = vi.fn()
      render(
        <EpisodeList
          episodes={mockEpisodes}
          onEpisodeSelect={onEpisodeSelect}
          testId="episode-list"
        />
      )
      fireEvent.click(screen.getByTestId('episode-list-episode-ep-1'))
      expect(onEpisodeSelect).toHaveBeenCalledWith(mockEpisodes[0])
    })
  })
})

describe('EpisodeCard', () => {
  const mockEpisode: Episode = {
    id: 'ep-1',
    seriesId: 'series-1',
    seasonId: 'season-1',
    seasonNumber: 1,
    episodeNumber: 1,
    title: 'Pilot',
    description: 'The first episode of the series.',
    streamUrl: 'http://example.com/stream1.m3u8',
    thumbnail: 'http://example.com/thumb1.jpg',
    duration: 3600,
  }

  describe('rendering', () => {
    it('renders episode title', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} />)
      expect(screen.getByText('Pilot')).toBeInTheDocument()
    })

    it('renders episode number', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} />)
      expect(screen.getByText('E1')).toBeInTheDocument()
    })

    it('renders episode duration in hours and minutes', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} />)
      expect(screen.getByText('1h 0m')).toBeInTheDocument()
    })

    it('renders duration in minutes only when less than an hour', () => {
      const shortEpisode: Episode = {
        ...mockEpisode,
        duration: 2700,
      }
      render(<EpisodeCard episode={shortEpisode} onSelect={vi.fn()} />)
      expect(screen.getByText('45m')).toBeInTheDocument()
    })

    it('renders episode description', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} />)
      expect(screen.getByText('The first episode of the series.')).toBeInTheDocument()
    })

    it('renders thumbnail when available', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} testId="episode" />)
      const img = screen.getByAltText('Pilot thumbnail')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/thumb1.jpg')
    })

    it('renders placeholder when no thumbnail', () => {
      const episodeNoThumb: Episode = {
        ...mockEpisode,
        thumbnail: undefined,
      }
      render(<EpisodeCard episode={episodeNoThumb} onSelect={vi.fn()} />)
      expect(screen.queryByAltText('Pilot thumbnail')).not.toBeInTheDocument()
    })

    it('does not render duration when undefined', () => {
      const episodeNoDuration: Episode = {
        ...mockEpisode,
        duration: undefined,
      }
      render(<EpisodeCard episode={episodeNoDuration} onSelect={vi.fn()} />)
      expect(screen.queryByText(/h /)).not.toBeInTheDocument()
      expect(screen.queryByText(/m$/)).not.toBeInTheDocument()
    })

    it('does not render duration when 0', () => {
      const episodeZeroDuration: Episode = {
        ...mockEpisode,
        duration: 0,
      }
      render(<EpisodeCard episode={episodeZeroDuration} onSelect={vi.fn()} />)
      expect(screen.queryByText('0m')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(<EpisodeCard episode={mockEpisode} onSelect={onSelect} testId="episode" />)
      fireEvent.click(screen.getByTestId('episode'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('is focusable with tabindex', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} testId="episode" />)
      expect(screen.getByTestId('episode')).toHaveAttribute('tabindex', '0')
    })

    it('has listitem role', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} testId="episode" />)
      expect(screen.getByTestId('episode')).toHaveAttribute('role', 'listitem')
    })

    it('has data-focused attribute for spatial navigation', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} testId="episode" />)
      expect(screen.getByTestId('episode')).toHaveAttribute('data-focused')
    })
  })

  describe('image error handling', () => {
    it('shows placeholder when thumbnail fails to load', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} />)
      const img = screen.getByAltText('Pilot thumbnail')

      fireEvent.error(img)

      expect(screen.queryByAltText('Pilot thumbnail')).not.toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(<EpisodeCard episode={mockEpisode} onSelect={vi.fn()} testId="episode" />)
      expect(screen.getByTestId('episode')).toBeInTheDocument()
    })
  })
})
