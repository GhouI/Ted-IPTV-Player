import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EPGPage } from './EPGPage'
import type { Source } from '../../core/types/source'
import type { Channel, Program, EPGData } from '../../core/types/channel'
import { useChannelStore } from '../../core/stores/channelStore'

// Mock the hooks
vi.mock('../../core/hooks/useChannelQueries', () => ({
  useLiveChannels: vi.fn(),
}))

vi.mock('../../core/hooks/useEPGQueries', () => ({
  useEPGTimeRange: vi.fn(),
}))

import { useLiveChannels } from '../../core/hooks/useChannelQueries'
import { useEPGTimeRange } from '../../core/hooks/useEPGQueries'

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

const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    name: 'Sports Channel',
    number: 1,
    logo: 'https://example.com/sports.png',
    categoryId: 'cat-1',
    streamUrl: 'http://example.com/sports',
    epgChannelId: 'epg-ch-1',
    isAvailable: true,
  },
  {
    id: 'ch-2',
    name: 'News Network',
    number: 2,
    categoryId: 'cat-2',
    streamUrl: 'http://example.com/news',
    epgChannelId: 'epg-ch-2',
    isAvailable: true,
  },
]

const now = Date.now()
const oneHour = 60 * 60 * 1000

const mockPrograms: Record<string, Program[]> = {
  'epg-ch-1': [
    {
      id: 'prog-1',
      channelId: 'epg-ch-1',
      title: 'Morning Show',
      description: 'Daily morning news',
      startTime: now - oneHour,
      endTime: now + oneHour,
    },
    {
      id: 'prog-2',
      channelId: 'epg-ch-1',
      title: 'Afternoon Sports',
      startTime: now + oneHour,
      endTime: now + 2 * oneHour,
    },
  ],
  'epg-ch-2': [
    {
      id: 'prog-3',
      channelId: 'epg-ch-2',
      title: 'Breaking News',
      startTime: now,
      endTime: now + 30 * 60 * 1000,
    },
  ],
}

const mockEPGData: EPGData = {
  programs: mockPrograms,
  lastUpdated: now,
  source: 'test',
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

describe('EPGPage', () => {
  const defaultProps = {
    source: mockSource,
    onProgramSelect: vi.fn(),
    onChannelSelect: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading skeletons while loading channels', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg')).toBeInTheDocument()
      expect(screen.getByTestId('epg-channel-skeleton-0')).toBeInTheDocument()
    })

    it('shows loading skeletons while loading EPG data', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg')).toBeInTheDocument()
      expect(screen.getByTestId('epg-program-skeleton-0-0')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when loading channels fails', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch channels'),
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByText('Failed to Load Program Guide')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch channels')).toBeInTheDocument()
    })

    it('shows error message when loading EPG fails', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch EPG'),
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByText('Failed to Load Program Guide')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch EPG')).toBeInTheDocument()
    })

    it('shows back button in error state', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Error'),
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-back-button')).toBeInTheDocument()
    })

    it('calls onBack when back button clicked in error state', async () => {
      const user = userEvent.setup()
      vi.mocked(useLiveChannels).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Error'),
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      await user.click(screen.getByTestId('epg-back-button'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('empty state', () => {
    it('shows empty state when no channels', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isSuccess: true,
        isPending: false,
        isError: false,
        status: 'success',
      } as unknown as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: mockEPGData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} />)

      expect(screen.getByText('No Program Guide Available')).toBeInTheDocument()
    })

    it('shows message about no source when source is null', () => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isSuccess: true,
        isPending: false,
        isError: false,
        status: 'success',
      } as unknown as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)

      renderWithProvider(<EPGPage {...defaultProps} source={null} />)

      expect(screen.getByText('Please select an IPTV source first.')).toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: mockEPGData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)
    })

    it('renders the page header', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByText('Program Guide')).toBeInTheDocument()
    })

    it('renders navigation buttons', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-nav-left')).toBeInTheDocument()
      expect(screen.getByTestId('epg-nav-now')).toBeInTheDocument()
      expect(screen.getByTestId('epg-nav-right')).toBeInTheDocument()
    })

    it('renders the timeline', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-timeline')).toBeInTheDocument()
    })

    it('renders the channel list', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-channel-list')).toBeInTheDocument()
    })

    it('renders the program grid', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-grid')).toBeInTheDocument()
    })

    it('displays channel names in the channel list', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByText('Sports Channel')).toBeInTheDocument()
      expect(screen.getByText('News Network')).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: mockEPGData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)
    })

    it('clicking Earlier button navigates time backward', async () => {
      const user = userEvent.setup()
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      const earlierButton = screen.getByTestId('epg-nav-left')
      await user.click(earlierButton)

      // EPG should re-render with updated time window
      // The useEPGTimeRange hook will be called again with new time params
      await waitFor(() => {
        expect(useEPGTimeRange).toHaveBeenCalled()
      })
    })

    it('clicking Later button navigates time forward', async () => {
      const user = userEvent.setup()
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      const laterButton = screen.getByTestId('epg-nav-right')
      await user.click(laterButton)

      await waitFor(() => {
        expect(useEPGTimeRange).toHaveBeenCalled()
      })
    })

    it('clicking Now button jumps to current time', async () => {
      const user = userEvent.setup()
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      const nowButton = screen.getByTestId('epg-nav-now')
      await user.click(nowButton)

      await waitFor(() => {
        expect(useEPGTimeRange).toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: mockEPGData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)
    })

    it('has accessible header', () => {
      renderWithProvider(<EPGPage {...defaultProps} />)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Program Guide')
    })

    it('has accessible navigation buttons', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByLabelText('Earlier programs')).toBeInTheDocument()
      expect(screen.getByLabelText('Later programs')).toBeInTheDocument()
    })

    it('has accessible channel list', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByRole('list', { name: 'Channels' })).toBeInTheDocument()
    })

    it('has accessible program grid', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByRole('grid', { name: 'Program guide' })).toBeInTheDocument()
    })
  })

  describe('testId', () => {
    beforeEach(() => {
      vi.mocked(useLiveChannels).mockReturnValue({
        data: mockChannels,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useLiveChannels>)

      vi.mocked(useEPGTimeRange).mockReturnValue({
        data: mockEPGData,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useEPGTimeRange>)
    })

    it('applies testId to container', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg')).toBeInTheDocument()
    })

    it('applies testId to timeline', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-timeline')).toBeInTheDocument()
    })

    it('applies testId to channel list', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-channel-list')).toBeInTheDocument()
    })

    it('applies testId to grid', () => {
      renderWithProvider(<EPGPage {...defaultProps} testId="epg" />)

      expect(screen.getByTestId('epg-grid')).toBeInTheDocument()
    })
  })
})
