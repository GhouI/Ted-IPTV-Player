import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SeasonList, SeasonItem } from './SeasonList'
import type { Season } from '../../core/types/vod'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
})

const mockSeasons: Season[] = [
  {
    id: 'season-1',
    seriesId: 'series-1',
    seasonNumber: 1,
    name: 'Season 1',
    episodeCount: 10,
  },
  {
    id: 'season-2',
    seriesId: 'series-1',
    seasonNumber: 2,
    name: 'Season 2',
    episodeCount: 12,
  },
  {
    id: 'season-3',
    seriesId: 'series-1',
    seasonNumber: 3,
    episodeCount: 8,
  },
]

describe('SeasonList', () => {
  describe('rendering', () => {
    it('renders all seasons', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId={null}
          onSeasonSelect={vi.fn()}
        />
      )
      expect(screen.getByText('Season 1')).toBeInTheDocument()
      expect(screen.getByText('Season 2')).toBeInTheDocument()
      expect(screen.getByText('Season 3')).toBeInTheDocument()
    })

    it('displays episode count for each season', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId={null}
          onSeasonSelect={vi.fn()}
        />
      )
      expect(screen.getByText('10 Episodes')).toBeInTheDocument()
      expect(screen.getByText('12 Episodes')).toBeInTheDocument()
      expect(screen.getByText('8 Episodes')).toBeInTheDocument()
    })

    it('applies testId to container', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId={null}
          onSeasonSelect={vi.fn()}
          testId="season-list"
        />
      )
      expect(screen.getByTestId('season-list')).toBeInTheDocument()
    })

    it('has listbox role for accessibility', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId={null}
          onSeasonSelect={vi.fn()}
          testId="season-list"
        />
      )
      expect(screen.getByTestId('season-list')).toHaveAttribute('role', 'listbox')
    })
  })

  describe('selection', () => {
    it('marks selected season with aria-selected', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId="season-2"
          onSeasonSelect={vi.fn()}
          testId="season-list"
        />
      )
      const selectedSeason = screen.getByTestId('season-list-season-season-2')
      expect(selectedSeason).toHaveAttribute('aria-selected', 'true')
    })

    it('marks non-selected seasons with aria-selected false', () => {
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId="season-2"
          onSeasonSelect={vi.fn()}
          testId="season-list"
        />
      )
      const nonSelectedSeason = screen.getByTestId('season-list-season-season-1')
      expect(nonSelectedSeason).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onSeasonSelect when a season is clicked', () => {
      const onSeasonSelect = vi.fn()
      render(
        <SeasonList
          seasons={mockSeasons}
          selectedSeasonId={null}
          onSeasonSelect={onSeasonSelect}
          testId="season-list"
        />
      )
      fireEvent.click(screen.getByTestId('season-list-season-season-1'))
      expect(onSeasonSelect).toHaveBeenCalledWith(mockSeasons[0])
    })
  })
})

describe('SeasonItem', () => {
  const mockSeason: Season = {
    id: 'season-1',
    seriesId: 'series-1',
    seasonNumber: 1,
    name: 'Season 1',
    episodeCount: 10,
  }

  describe('rendering', () => {
    it('renders season name', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.getByText('Season 1')).toBeInTheDocument()
    })

    it('renders fallback name when name is not provided', () => {
      const seasonWithoutName: Season = {
        ...mockSeason,
        name: undefined,
      }
      render(
        <SeasonItem
          season={seasonWithoutName}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.getByText('Season 1')).toBeInTheDocument()
    })

    it('renders episode count', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.getByText('10 Episodes')).toBeInTheDocument()
    })

    it('renders singular Episode for 1 episode', () => {
      const seasonOneEpisode: Season = {
        ...mockSeason,
        episodeCount: 1,
      }
      render(
        <SeasonItem
          season={seasonOneEpisode}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.getByText('1 Episode')).toBeInTheDocument()
    })

    it('does not render episode count when undefined', () => {
      const seasonNoCount: Season = {
        ...mockSeason,
        episodeCount: undefined,
      }
      render(
        <SeasonItem
          season={seasonNoCount}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.queryByText(/Episode/)).not.toBeInTheDocument()
    })

    it('does not render episode count when 0', () => {
      const seasonZeroEpisodes: Season = {
        ...mockSeason,
        episodeCount: 0,
      }
      render(
        <SeasonItem
          season={seasonZeroEpisodes}
          isSelected={false}
          onSelect={vi.fn()}
        />
      )
      expect(screen.queryByText(/0 Episode/)).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={onSelect}
          testId="season-item"
        />
      )
      fireEvent.click(screen.getByTestId('season-item'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('is focusable with tabindex', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
          testId="season-item"
        />
      )
      expect(screen.getByTestId('season-item')).toHaveAttribute('tabindex', '0')
    })

    it('has option role', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
          testId="season-item"
        />
      )
      expect(screen.getByTestId('season-item')).toHaveAttribute('role', 'option')
    })
  })

  describe('selection state', () => {
    it('has data-selected attribute when selected', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={true}
          onSelect={vi.fn()}
          testId="season-item"
        />
      )
      expect(screen.getByTestId('season-item')).toHaveAttribute('data-selected', 'true')
    })

    it('has data-selected attribute false when not selected', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
          testId="season-item"
        />
      )
      expect(screen.getByTestId('season-item')).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      render(
        <SeasonItem
          season={mockSeason}
          isSelected={false}
          onSelect={vi.fn()}
          testId="season-item"
        />
      )
      expect(screen.getByTestId('season-item')).toBeInTheDocument()
    })
  })
})
