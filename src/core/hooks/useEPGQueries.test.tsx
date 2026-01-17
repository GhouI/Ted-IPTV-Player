import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  epgKeys,
  useFullEPG,
  useChannelEPG,
  useCurrentProgram,
  useEPGTimeRange,
  useNowNextPrograms,
  usePrefetchEPG,
  usePrefetchChannelEPG,
  useInvalidateEPG,
  useClearEPGCache,
} from './useEPGQueries'
import type { Source } from '../types/source'
import type { Program, EPGData } from '../types/channel'
import { SourceNormalizer } from '../api/sourceNormalizer'

// Mock the SourceNormalizer
vi.mock('../api/sourceNormalizer', () => ({
  SourceNormalizer: vi.fn(),
}))

const MockSourceNormalizer = vi.mocked(SourceNormalizer)

// Test data
const mockSource: Source = {
  id: 'test-source-1',
  name: 'Test Source',
  type: 'xtream',
  serverUrl: 'http://example.com',
  username: 'user',
  password: 'pass',
  createdAt: Date.now(),
}

const now = Date.now()
const oneHour = 60 * 60 * 1000

const mockPrograms: Program[] = [
  {
    id: 'prog1',
    channelId: 'ch1',
    title: 'Morning News',
    description: 'Daily news broadcast',
    startTime: now - oneHour,
    endTime: now + oneHour,
  },
  {
    id: 'prog2',
    channelId: 'ch1',
    title: 'Weather Report',
    description: 'Weather forecast',
    startTime: now + oneHour,
    endTime: now + 2 * oneHour,
  },
  {
    id: 'prog3',
    channelId: 'ch1',
    title: 'Evening Show',
    description: 'Entertainment show',
    startTime: now + 2 * oneHour,
    endTime: now + 3 * oneHour,
  },
]

const mockChannel2Programs: Program[] = [
  {
    id: 'prog4',
    channelId: 'ch2',
    title: 'Sports Live',
    description: 'Live sports coverage',
    startTime: now - 30 * 60 * 1000,
    endTime: now + 30 * 60 * 1000,
  },
  {
    id: 'prog5',
    channelId: 'ch2',
    title: 'Sports Analysis',
    description: 'Post-game analysis',
    startTime: now + 30 * 60 * 1000,
    endTime: now + oneHour + 30 * 60 * 1000,
  },
]

const mockEPGData: EPGData = {
  programs: {
    ch1: mockPrograms,
    ch2: mockChannel2Programs,
  },
  lastUpdated: now,
  source: 'xtream',
}

// Helper to create query client wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

describe('epgKeys', () => {
  it('generates correct query keys', () => {
    expect(epgKeys.all).toEqual(['epg'])
    expect(epgKeys.fullGuide('source-1')).toEqual(['epg', 'full', 'source-1'])
    expect(epgKeys.channelPrograms('source-1', 'ch-1')).toEqual([
      'epg',
      'channel',
      'source-1',
      'ch-1',
    ])
    expect(epgKeys.currentProgram('source-1', 'ch-1')).toEqual([
      'epg',
      'current',
      'source-1',
      'ch-1',
    ])
    expect(epgKeys.timeRange('source-1', 1000, 2000)).toEqual([
      'epg',
      'range',
      'source-1',
      1000,
      2000,
    ])
  })
})

describe('useFullEPG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches EPG data successfully', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFullEPG({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockEPGData)
    expect(mockGetEPG).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when source is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFullEPG({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled is false', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFullEPG({ source: mockSource, enabled: false }), {
      wrapper,
    })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    const mockError = new Error('Network error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFullEPG({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useChannelEPG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches channel EPG successfully', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useChannelEPG({ source: mockSource, channelId: 'ch1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPrograms)
    expect(mockGetEPG).toHaveBeenCalledWith('ch1')
  })

  it('returns empty array when channel has no programs', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue({
      programs: {},
      lastUpdated: now,
    })
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useChannelEPG({ source: mockSource, channelId: 'unknown-channel' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('does not fetch when channelId is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useChannelEPG({ source: mockSource, channelId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })

  it('does not fetch when source is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useChannelEPG({ source: null, channelId: 'ch1' }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })
})

describe('useCurrentProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current program', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useCurrentProgram({ source: mockSource, channelId: 'ch1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // First program is currently playing (startTime is 1 hour ago, endTime is 1 hour from now)
    expect(result.current.data?.id).toBe('prog1')
    expect(result.current.data?.title).toBe('Morning News')
  })

  it('returns null when no current program', async () => {
    const futurePrograms: Program[] = [
      {
        id: 'future1',
        channelId: 'ch1',
        title: 'Future Show',
        startTime: now + 2 * oneHour,
        endTime: now + 3 * oneHour,
      },
    ]

    const mockGetEPG = vi.fn().mockResolvedValue({
      programs: { ch1: futurePrograms },
      lastUpdated: now,
    })
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useCurrentProgram({ source: mockSource, channelId: 'ch1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeNull()
  })

  it('does not fetch when channelId is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useCurrentProgram({ source: mockSource, channelId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })
})

describe('useEPGTimeRange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches EPG data filtered by time range', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    // Query for programs in the next 2 hours
    const { result } = renderHook(
      () =>
        useEPGTimeRange({
          source: mockSource,
          startTime: now,
          endTime: now + 2 * oneHour,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Should include programs that overlap with the time range
    expect(result.current.data?.programs['ch1']).toBeDefined()
    // prog1 overlaps (ends in 1 hour), prog2 overlaps (starts in 1 hour)
    expect(result.current.data?.programs['ch1']?.length).toBeGreaterThan(0)
  })

  it('does not fetch when time range is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useEPGTimeRange({
          source: mockSource,
          startTime: null,
          endTime: null,
        }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })

  it('does not fetch when source is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useEPGTimeRange({
          source: null,
          startTime: now,
          endTime: now + oneHour,
        }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })
})

describe('useNowNextPrograms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches now/next programs for multiple channels', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useNowNextPrograms({
          source: mockSource,
          channelIds: ['ch1', 'ch2'],
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Channel 1
    expect(result.current.data?.['ch1']?.now?.title).toBe('Morning News')
    expect(result.current.data?.['ch1']?.next?.title).toBe('Weather Report')

    // Channel 2
    expect(result.current.data?.['ch2']?.now?.title).toBe('Sports Live')
    expect(result.current.data?.['ch2']?.next?.title).toBe('Sports Analysis')
  })

  it('returns null for channels without programs', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue({
      programs: {},
      lastUpdated: now,
    })
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useNowNextPrograms({
          source: mockSource,
          channelIds: ['ch1'],
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.['ch1']?.now).toBeNull()
    expect(result.current.data?.['ch1']?.next).toBeNull()
  })

  it('does not fetch when channelIds is empty', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useNowNextPrograms({
          source: mockSource,
          channelIds: [],
        }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })

  it('does not fetch when source is null', () => {
    const mockGetEPG = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () =>
        useNowNextPrograms({
          source: null,
          channelIds: ['ch1', 'ch2'],
        }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetEPG).not.toHaveBeenCalled()
  })
})

describe('usePrefetchEPG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches full EPG data', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchEPG(), { wrapper })

    await result.current(mockSource)

    // Check that data is in cache
    const cachedEPG = queryClient.getQueryData(epgKeys.fullGuide(mockSource.id))

    expect(cachedEPG).toEqual(mockEPGData)
  })
})

describe('usePrefetchChannelEPG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches channel EPG data', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchChannelEPG(), { wrapper })

    await result.current(mockSource, 'ch1')

    // Check that data is in cache
    const cachedPrograms = queryClient.getQueryData(
      epgKeys.channelPrograms(mockSource.id, 'ch1')
    )

    expect(cachedPrograms).toEqual(mockPrograms)
    expect(mockGetEPG).toHaveBeenCalledWith('ch1')
  })
})

describe('useInvalidateEPG', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates EPG caches for a source', async () => {
    const mockGetEPG = vi.fn().mockResolvedValue(mockEPGData)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getEPG: mockGetEPG,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    // First, populate the cache
    queryClient.setQueryData(epgKeys.fullGuide(mockSource.id), mockEPGData)
    queryClient.setQueryData(epgKeys.channelPrograms(mockSource.id, 'ch1'), mockPrograms)
    queryClient.setQueryData(
      epgKeys.currentProgram(mockSource.id, 'ch1'),
      mockPrograms[0]
    )

    const { result } = renderHook(() => useInvalidateEPG(), { wrapper })

    await result.current(mockSource.id)

    // Check that queries are invalidated (stale)
    const fullGuideState = queryClient.getQueryState(epgKeys.fullGuide(mockSource.id))
    const channelState = queryClient.getQueryState(
      epgKeys.channelPrograms(mockSource.id, 'ch1')
    )
    const currentState = queryClient.getQueryState(
      epgKeys.currentProgram(mockSource.id, 'ch1')
    )

    expect(fullGuideState?.isInvalidated).toBe(true)
    expect(channelState?.isInvalidated).toBe(true)
    expect(currentState?.isInvalidated).toBe(true)
  })
})

describe('useClearEPGCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears all EPG caches', async () => {
    const { wrapper, queryClient } = createWrapper()

    // Populate the cache with multiple sources
    queryClient.setQueryData(epgKeys.fullGuide('source-1'), mockEPGData)
    queryClient.setQueryData(epgKeys.channelPrograms('source-1', 'ch1'), mockPrograms)
    queryClient.setQueryData(epgKeys.fullGuide('source-2'), mockEPGData)
    queryClient.setQueryData(epgKeys.channelPrograms('source-2', 'ch1'), mockPrograms)

    const { result } = renderHook(() => useClearEPGCache(), { wrapper })

    result.current()

    // Check that all EPG caches are removed
    expect(queryClient.getQueryData(epgKeys.fullGuide('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(epgKeys.channelPrograms('source-1', 'ch1'))).toBeUndefined()
    expect(queryClient.getQueryData(epgKeys.fullGuide('source-2'))).toBeUndefined()
    expect(queryClient.getQueryData(epgKeys.channelPrograms('source-2', 'ch1'))).toBeUndefined()
  })
})
