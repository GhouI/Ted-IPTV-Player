import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LiveTVPage } from './LiveTVPage'
import type { Source } from '../../core/types/source'
import type { Category, Channel } from '../../core/types/channel'
import { useChannelStore } from '../../core/stores/channelStore'

// Mock the channel queries hook
vi.mock('../../core/hooks/useChannelQueries', () => ({
  useLiveContent: vi.fn(),
}))

import { useLiveContent } from '../../core/hooks/useChannelQueries'

// Initialize spatial navigation for tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset channel store before each test
  useChannelStore.getState().reset()
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

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Sports' },
  { id: 'cat-2', name: 'News' },
]

const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    name: 'Sports Channel',
    number: 1,
    logo: 'https://example.com/sports.png',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/sports',
    isAvailable: true,
  },
  {
    id: 'ch-2',
    name: 'News Network',
    number: 2,
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/news',
    isAvailable: true,
  },
  {
    id: 'ch-3',
    name: 'Sports Live',
    number: 3,
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/sportslive',
    isAvailable: true,
  },
]

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

describe('LiveTVPage', () => {
  const defaultProps = {
    source: mockSource,
    onChannelSelect: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeletons while loading', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: [],
        isLoading: true,
        isFetching: true,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv')).toBeInTheDocument()
      expect(screen.getByTestId('live-tv-category-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('live-tv-grid-title-skeleton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when loading fails', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Failed to fetch channels'),
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByText('Failed to Load Channels')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch channels')).toBeInTheDocument()
    })

    it('shows back button in error state', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv-back-button')).toBeInTheDocument()
    })

    it('calls onBack when back button clicked in error state', async () => {
      const user = userEvent.setup()
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: [],
        isLoading: false,
        isFetching: false,
        error: new Error('Error'),
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      await user.click(screen.getByTestId('live-tv-back-button'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no channels', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} />)

      expect(screen.getByText('No Channels Available')).toBeInTheDocument()
    })

    it('shows empty state when no categories', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} />)

      expect(screen.getByText('No Channels Available')).toBeInTheDocument()
    })

    it('shows message about no source when source is null', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: [],
        channels: [],
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} source={null} />)

      expect(screen.getByText('Please select an IPTV source first.')).toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })
    })

    it('renders category list', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByTestId('live-tv-category-list')).toBeInTheDocument()
      // Check category items exist via testId
      expect(screen.getByTestId('live-tv-category-list-item-cat-1')).toBeInTheDocument()
      expect(screen.getByTestId('live-tv-category-list-item-cat-2')).toBeInTheDocument()
    })

    it('renders channel grid', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv-channel-grid')).toBeInTheDocument()
    })

    it('displays channel count', async () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      await waitFor(() => {
        expect(screen.getByText(/\(\d+ channels\)/)).toBeInTheDocument()
      })
    })

    it('auto-selects first category', async () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      await waitFor(() => {
        // First category should be selected (aria-selected="true")
        const firstCategory = screen.getByTestId('live-tv-category-list-item-cat-1')
        expect(firstCategory).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('filters channels by selected category', async () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      await waitFor(() => {
        // Should show Sports category channels (2 channels)
        expect(screen.getByText('(2 channels)')).toBeInTheDocument()
      })
    })
  })

  describe('interaction', () => {
    beforeEach(() => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })
    })

    it('renders focusable category items', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      // All category items should have data-focused attribute for spatial navigation
      const category1 = screen.getByTestId('live-tv-category-list-item-cat-1')
      const category2 = screen.getByTestId('live-tv-category-list-item-cat-2')

      expect(category1).toHaveAttribute('data-focused')
      expect(category2).toHaveAttribute('data-focused')
      expect(category1).toHaveAttribute('tabindex', '0')
      expect(category2).toHaveAttribute('tabindex', '0')
    })

    it('renders focusable channel cards', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      // Channel cards should have button role and be focusable
      const channel1 = screen.getByTestId('live-tv-channel-grid-channel-ch-1')
      expect(channel1).toHaveAttribute('role', 'button')
      expect(channel1).toHaveAttribute('tabindex', '0')
    })

    it('first category starts selected', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      const firstCategory = screen.getByTestId('live-tv-category-list-item-cat-1')
      expect(firstCategory).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })
    })

    it('has accessible category sidebar', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} />)

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'Channel categories')
    })

    it('has main content area', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has heading for categories section', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Categories')
    })

    it('has heading showing selected category', () => {
      renderWithProvider(<LiveTVPage {...defaultProps} />)

      // Should have level 1 heading in main content area
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    it('applies testId to container', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv')).toBeInTheDocument()
    })

    it('applies testId to category list', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv-category-list')).toBeInTheDocument()
    })

    it('applies testId to channel grid', () => {
      vi.mocked(useLiveContent).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        isLoading: false,
        isFetching: false,
        error: null,
        categoriesQuery: {} as ReturnType<typeof useLiveContent>['categoriesQuery'],
        channelsQuery: {} as ReturnType<typeof useLiveContent>['channelsQuery'],
      })

      renderWithProvider(<LiveTVPage {...defaultProps} testId="live-tv" />)

      expect(screen.getByTestId('live-tv-channel-grid')).toBeInTheDocument()
    })
  })
})
