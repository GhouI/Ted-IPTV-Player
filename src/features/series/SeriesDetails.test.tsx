import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SeriesDetails } from './SeriesDetails'
import type { Source } from '../../core/types/source'
import type { Series, Season, Episode, SeriesInfo } from '../../core/types/vod'
import { useSeriesStore } from '../../core/stores/seriesStore'

// Mock the series queries hook
vi.mock('../../core/hooks/useSeriesQueries', () => ({
  useSeriesInfo: vi.fn(),
}))

import { useSeriesInfo } from '../../core/hooks/useSeriesQueries'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset series store before each test
  useSeriesStore.getState().reset()
})

const mockSource: Source = {
  id: 'source-1',
  name: 'Test Source',
  type: 'xtream',
  serverUrl: 'http://example.com',
  username: 'user',
  password: 'pass',
  createdAt: Date.now(),
}

const mockSeries: Series = {
  id: 'series-1',
  title: 'Test Series',
  description: 'A test series description.',
  categoryId: 'cat-1',
  poster: 'http://example.com/poster.jpg',
  backdrop: 'http://example.com/backdrop.jpg',
  year: 2024,
  genres: ['Drama', 'Thriller'],
  cast: ['Actor One', 'Actor Two'],
  score: 8.5,
  rating: 'TV-MA',
  seasonCount: 2,
  episodeCount: 16,
}

const mockSeasons: Season[] = [
  {
    id: 'season-1',
    seriesId: 'series-1',
    seasonNumber: 1,
    name: 'Season 1',
    episodeCount: 8,
  },
  {
    id: 'season-2',
    seriesId: 'series-1',
    seasonNumber: 2,
    name: 'Season 2',
    episodeCount: 8,
  },
]

const mockEpisodes: Record<string, Episode[]> = {
  'season-1': [
    {
      id: 'ep-1',
      seriesId: 'series-1',
      seasonId: 'season-1',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pilot',
      description: 'The first episode.',
      streamUrl: 'http://example.com/s1e1.m3u8',
      duration: 3600,
    },
    {
      id: 'ep-2',
      seriesId: 'series-1',
      seasonId: 'season-1',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Episode 2',
      streamUrl: 'http://example.com/s1e2.m3u8',
      duration: 2700,
    },
  ],
  'season-2': [
    {
      id: 'ep-3',
      seriesId: 'series-1',
      seasonId: 'season-2',
      seasonNumber: 2,
      episodeNumber: 1,
      title: 'New Beginning',
      streamUrl: 'http://example.com/s2e1.m3u8',
      duration: 3600,
    },
  ],
}

const mockSeriesInfo: SeriesInfo = {
  series: mockSeries,
  seasons: mockSeasons,
  episodes: mockEpisodes,
}

// Helper to create a query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Helper to render with QueryClientProvider
function renderWithProvider(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('SeriesDetails', () => {
  const defaultProps = {
    series: mockSeries,
    source: mockSource,
    onEpisodePlay: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeletons while loading', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      expect(screen.getByTestId('series-details')).toBeInTheDocument()
      expect(screen.getByTestId('series-details-poster-skeleton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when loading fails', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch series info'),
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      expect(screen.getByText('Failed to Load Series Details')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch series info')).toBeInTheDocument()
    })

    it('shows back button in error state', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Error'),
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      expect(screen.getByTestId('series-details-back-btn')).toBeInTheDocument()
    })

    it('calls onBack when back button clicked in error state', async () => {
      const user = userEvent.setup()
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Error'),
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      await user.click(screen.getByTestId('series-details-back-btn'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: mockSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)
    })

    it('renders series title', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('Test Series')).toBeInTheDocument()
    })

    it('renders series description', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('A test series description.')).toBeInTheDocument()
    })

    it('renders year when available', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('renders rating badge when available', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('TV-MA')).toBeInTheDocument()
    })

    it('renders score when available', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('renders season and episode counts', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('2 Seasons')).toBeInTheDocument()
      expect(screen.getByText('16 Episodes')).toBeInTheDocument()
    })

    it('renders genres as tags', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText('Drama')).toBeInTheDocument()
      expect(screen.getByText('Thriller')).toBeInTheDocument()
    })

    it('renders cast members', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} />)
      expect(screen.getByText(/Actor One/)).toBeInTheDocument()
    })

    it('renders season list', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByText('Seasons')).toBeInTheDocument()
      expect(screen.getByTestId('series-details-season-list')).toBeInTheDocument()
    })

    it('renders all seasons', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-season-list-season-season-1')).toBeInTheDocument()
      expect(screen.getByTestId('series-details-season-list-season-season-2')).toBeInTheDocument()
    })

    it('renders episode list', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-episode-list')).toBeInTheDocument()
    })

    it('auto-selects first season', async () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      await waitFor(() => {
        const firstSeason = screen.getByTestId('series-details-season-list-season-season-1')
        expect(firstSeason).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('shows episodes for selected season', async () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      await waitFor(() => {
        expect(screen.getByText('Pilot')).toBeInTheDocument()
        expect(screen.getByText('Episode 2')).toBeInTheDocument()
      })
    })

    it('renders back button', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-back-btn')).toBeInTheDocument()
      expect(screen.getByText('Back')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    beforeEach(() => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: mockSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)
    })

    it('calls onBack when back button clicked', async () => {
      const user = userEvent.setup()
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      await user.click(screen.getByTestId('series-details-back-btn'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })

    it('calls onBack when Escape key pressed', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })

    it('calls onBack when Backspace key pressed', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      fireEvent.keyDown(window, { key: 'Backspace' })
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })

    it('calls onEpisodePlay when episode is clicked', async () => {
      const user = userEvent.setup()
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      await waitFor(() => {
        expect(screen.getByTestId('series-details-episode-list-episode-ep-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('series-details-episode-list-episode-ep-1'))
      expect(defaultProps.onEpisodePlay).toHaveBeenCalledWith(mockEpisodes['season-1'][0])
    })
  })

  describe('season switching', () => {
    beforeEach(() => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: mockSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)
    })

    it('updates episodes when season is changed', async () => {
      const user = userEvent.setup()
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Pilot')).toBeInTheDocument()
      })

      // Click season 2
      await user.click(screen.getByTestId('series-details-season-list-season-season-2'))

      // Wait for episodes to update
      await waitFor(() => {
        expect(screen.getByText('New Beginning')).toBeInTheDocument()
      })
    })

    it('marks new season as selected', async () => {
      const user = userEvent.setup()
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('series-details-season-list-season-season-1')).toHaveAttribute(
          'aria-selected',
          'true'
        )
      })

      // Click season 2
      await user.click(screen.getByTestId('series-details-season-list-season-season-2'))

      // Check selection changed
      await waitFor(() => {
        expect(screen.getByTestId('series-details-season-list-season-season-2')).toHaveAttribute(
          'aria-selected',
          'true'
        )
        expect(screen.getByTestId('series-details-season-list-season-season-1')).toHaveAttribute(
          'aria-selected',
          'false'
        )
      })
    })
  })

  describe('minimal series data', () => {
    const minimalSeries: Series = {
      id: 'series-minimal',
      title: 'Minimal Series',
      categoryId: 'cat-1',
    }

    const minimalSeriesInfo: SeriesInfo = {
      series: minimalSeries,
      seasons: mockSeasons,
      episodes: mockEpisodes,
    }

    it('renders with minimal data', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: minimalSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(
        <SeriesDetails
          {...defaultProps}
          series={minimalSeries}
          testId="series-details"
        />
      )

      expect(screen.getByText('Minimal Series')).toBeInTheDocument()
    })

    it('does not render year when not available', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: minimalSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(
        <SeriesDetails
          {...defaultProps}
          series={minimalSeries}
          testId="series-details"
        />
      )

      expect(screen.queryByText('2024')).not.toBeInTheDocument()
    })

    it('does not render genres when not available', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: minimalSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(
        <SeriesDetails
          {...defaultProps}
          series={minimalSeries}
          testId="series-details"
        />
      )

      expect(screen.queryByText('Drama')).not.toBeInTheDocument()
    })

    it('does not render cast when not available', () => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: minimalSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)

      renderWithProvider(
        <SeriesDetails
          {...defaultProps}
          series={minimalSeries}
          testId="series-details"
        />
      )

      expect(screen.queryByText(/Cast:/)).not.toBeInTheDocument()
    })
  })

  describe('testId', () => {
    beforeEach(() => {
      vi.mocked(useSeriesInfo).mockReturnValue({
        data: mockSeriesInfo,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSeriesInfo>)
    })

    it('applies testId to container', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details')).toBeInTheDocument()
    })

    it('applies testId to season list', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-season-list')).toBeInTheDocument()
    })

    it('applies testId to episode list', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-episode-list')).toBeInTheDocument()
    })

    it('applies testId to back button', () => {
      renderWithProvider(<SeriesDetails {...defaultProps} testId="series-details" />)
      expect(screen.getByTestId('series-details-back-btn')).toBeInTheDocument()
    })
  })
})
