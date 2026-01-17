import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  channelKeys,
  useLiveCategories,
  useLiveChannels,
  useLiveChannelsByCategory,
  useLiveContent,
  usePrefetchChannels,
  useInvalidateChannels,
  useClearChannelCache,
} from './useChannelQueries'
import type { Source } from '../types/source'
import type { Category, Channel } from '../types/channel'
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

const mockCategories: Category[] = [
  { id: '1', name: 'Sports' },
  { id: '2', name: 'News' },
  { id: '3', name: 'Movies' },
]

const mockChannels: Channel[] = [
  {
    id: 'ch1',
    name: 'ESPN',
    categoryId: '1',
    streamUrl: 'http://example.com/stream/1',
  },
  {
    id: 'ch2',
    name: 'CNN',
    categoryId: '2',
    streamUrl: 'http://example.com/stream/2',
  },
  {
    id: 'ch3',
    name: 'HBO',
    categoryId: '3',
    streamUrl: 'http://example.com/stream/3',
  },
]

const mockSportsChannels: Channel[] = [
  {
    id: 'ch1',
    name: 'ESPN',
    categoryId: '1',
    streamUrl: 'http://example.com/stream/1',
  },
]

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

describe('channelKeys', () => {
  it('generates correct query keys', () => {
    expect(channelKeys.all).toEqual(['channels'])
    expect(channelKeys.categories('source-1')).toEqual(['channels', 'categories', 'source-1'])
    expect(channelKeys.channelList('source-1')).toEqual(['channels', 'list', 'source-1'])
    expect(channelKeys.channelsByCategory('source-1', 'cat-1')).toEqual([
      'channels',
      'list',
      'source-1',
      'cat-1',
    ])
    expect(channelKeys.channel('source-1', 'ch-1')).toEqual([
      'channels',
      'detail',
      'source-1',
      'ch-1',
    ])
  })
})

describe('useLiveCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches categories successfully', async () => {
    const mockGetLiveCategories = vi.fn().mockResolvedValue(mockCategories)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveCategories({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCategories)
    expect(mockGetLiveCategories).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when source is null', () => {
    const mockGetLiveCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveCategories({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetLiveCategories).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled is false', () => {
    const mockGetLiveCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useLiveCategories({ source: mockSource, enabled: false }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetLiveCategories).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    const mockError = new Error('Network error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveCategories({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useLiveChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches channels successfully', async () => {
    const mockGetLiveChannels = vi.fn().mockResolvedValue(mockChannels)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveChannels({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockChannels)
    expect(mockGetLiveChannels).toHaveBeenCalledTimes(1)
    expect(mockGetLiveChannels).toHaveBeenCalledWith()
  })

  it('does not fetch when source is null', () => {
    const mockGetLiveChannels = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveChannels({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetLiveChannels).not.toHaveBeenCalled()
  })
})

describe('useLiveChannelsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches channels for a category successfully', async () => {
    const mockGetLiveChannels = vi.fn().mockResolvedValue(mockSportsChannels)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useLiveChannelsByCategory({ source: mockSource, categoryId: '1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSportsChannels)
    expect(mockGetLiveChannels).toHaveBeenCalledWith('1')
  })

  it('does not fetch when categoryId is null', () => {
    const mockGetLiveChannels = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useLiveChannelsByCategory({ source: mockSource, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetLiveChannels).not.toHaveBeenCalled()
  })

  it('does not fetch when both source and categoryId are null', () => {
    const mockGetLiveChannels = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useLiveChannelsByCategory({ source: null, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetLiveChannels).not.toHaveBeenCalled()
  })
})

describe('useLiveContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches both categories and channels', async () => {
    const mockGetLiveCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetLiveChannels = vi.fn().mockResolvedValue(mockChannels)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveContent({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.channels).toEqual(mockChannels)
    expect(result.current.error).toBeNull()
  })

  it('returns empty arrays when source is null', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveContent({ source: null }), { wrapper })

    expect(result.current.categories).toEqual([])
    expect(result.current.channels).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('reports error from categories query', async () => {
    const mockError = new Error('Categories error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: vi.fn().mockRejectedValue(mockError),
          getLiveChannels: vi.fn().mockResolvedValue(mockChannels),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Categories error')
  })

  it('reports error from channels query', async () => {
    const mockError = new Error('Channels error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: vi.fn().mockResolvedValue(mockCategories),
          getLiveChannels: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useLiveContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Channels error')
  })
})

describe('usePrefetchChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches categories and channels', async () => {
    const mockGetLiveCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetLiveChannels = vi.fn().mockResolvedValue(mockChannels)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchChannels(), { wrapper })

    await result.current(mockSource)

    // Check that data is in cache
    const cachedCategories = queryClient.getQueryData(channelKeys.categories(mockSource.id))
    const cachedChannels = queryClient.getQueryData(channelKeys.channelList(mockSource.id))

    expect(cachedCategories).toEqual(mockCategories)
    expect(cachedChannels).toEqual(mockChannels)
  })
})

describe('useInvalidateChannels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates channel caches for a source', async () => {
    const mockGetLiveCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetLiveChannels = vi.fn().mockResolvedValue(mockChannels)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getLiveCategories: mockGetLiveCategories,
          getLiveChannels: mockGetLiveChannels,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    // First, populate the cache
    queryClient.setQueryData(channelKeys.categories(mockSource.id), mockCategories)
    queryClient.setQueryData(channelKeys.channelList(mockSource.id), mockChannels)

    const { result } = renderHook(() => useInvalidateChannels(), { wrapper })

    await result.current(mockSource.id)

    // Check that queries are invalidated (stale)
    const categoriesState = queryClient.getQueryState(channelKeys.categories(mockSource.id))
    const channelsState = queryClient.getQueryState(channelKeys.channelList(mockSource.id))

    expect(categoriesState?.isInvalidated).toBe(true)
    expect(channelsState?.isInvalidated).toBe(true)
  })
})

describe('useClearChannelCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears all channel caches', async () => {
    const { wrapper, queryClient } = createWrapper()

    // Populate the cache with multiple sources
    queryClient.setQueryData(channelKeys.categories('source-1'), mockCategories)
    queryClient.setQueryData(channelKeys.channelList('source-1'), mockChannels)
    queryClient.setQueryData(channelKeys.categories('source-2'), mockCategories)
    queryClient.setQueryData(channelKeys.channelList('source-2'), mockChannels)

    const { result } = renderHook(() => useClearChannelCache(), { wrapper })

    result.current()

    // Check that all channel caches are removed
    expect(queryClient.getQueryData(channelKeys.categories('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(channelKeys.channelList('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(channelKeys.categories('source-2'))).toBeUndefined()
    expect(queryClient.getQueryData(channelKeys.channelList('source-2'))).toBeUndefined()
  })
})
