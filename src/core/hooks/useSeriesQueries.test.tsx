import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  seriesKeys,
  useSeriesCategories,
  useSeriesList,
  useSeriesByCategory,
  useSeriesInfo,
  useSeriesContent,
  usePrefetchSeries,
  usePrefetchSeriesInfo,
  useInvalidateSeries,
  useClearSeriesCache,
} from './useSeriesQueries'
import type { Source } from '../types/source'
import type { VODCategory, Series, SeriesInfo, Season, Episode } from '../types/vod'
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

const mockCategories: VODCategory[] = [
  { id: '1', name: 'Drama' },
  { id: '2', name: 'Comedy' },
  { id: '3', name: 'Action' },
]

const mockSeries: Series[] = [
  {
    id: 'series1',
    title: 'Breaking Bad',
    categoryId: '1',
    description: 'A chemistry teacher turns to cooking meth',
    year: 2008,
    seasonCount: 5,
    episodeCount: 62,
  },
  {
    id: 'series2',
    title: 'The Office',
    categoryId: '2',
    description: 'A mockumentary about office life',
    year: 2005,
    seasonCount: 9,
    episodeCount: 201,
  },
  {
    id: 'series3',
    title: 'Game of Thrones',
    categoryId: '1',
    description: 'Fantasy drama series',
    year: 2011,
    seasonCount: 8,
    episodeCount: 73,
  },
]

const mockDramaSeries: Series[] = [
  {
    id: 'series1',
    title: 'Breaking Bad',
    categoryId: '1',
    description: 'A chemistry teacher turns to cooking meth',
    year: 2008,
    seasonCount: 5,
    episodeCount: 62,
  },
]

const mockSeasons: Season[] = [
  {
    id: 'season1',
    seriesId: 'series1',
    seasonNumber: 1,
    name: 'Season 1',
    episodeCount: 7,
  },
  {
    id: 'season2',
    seriesId: 'series1',
    seasonNumber: 2,
    name: 'Season 2',
    episodeCount: 13,
  },
]

const mockEpisodes: Record<string, Episode[]> = {
  season1: [
    {
      id: 'ep1',
      seriesId: 'series1',
      seasonId: 'season1',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pilot',
      streamUrl: 'http://example.com/series/1',
      duration: 3600,
    },
    {
      id: 'ep2',
      seriesId: 'series1',
      seasonId: 'season1',
      seasonNumber: 1,
      episodeNumber: 2,
      title: "Cat's in the Bag...",
      streamUrl: 'http://example.com/series/2',
      duration: 2880,
    },
  ],
}

const mockSeriesInfo: SeriesInfo = {
  series: mockSeries[0],
  seasons: mockSeasons,
  episodes: mockEpisodes,
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

describe('seriesKeys', () => {
  it('generates correct query keys', () => {
    expect(seriesKeys.all).toEqual(['series'])
    expect(seriesKeys.categories('source-1')).toEqual(['series', 'categories', 'source-1'])
    expect(seriesKeys.seriesList('source-1')).toEqual(['series', 'list', 'source-1'])
    expect(seriesKeys.seriesByCategory('source-1', 'cat-1')).toEqual([
      'series',
      'list',
      'source-1',
      'cat-1',
    ])
    expect(seriesKeys.seriesInfo('source-1', 'series-1')).toEqual([
      'series',
      'info',
      'source-1',
      'series-1',
    ])
  })
})

describe('useSeriesCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches categories successfully', async () => {
    const mockGetSeriesCategories = vi.fn().mockResolvedValue(mockCategories)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesCategories({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCategories)
    expect(mockGetSeriesCategories).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when source is null', () => {
    const mockGetSeriesCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesCategories({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeriesCategories).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled is false', () => {
    const mockGetSeriesCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesCategories({ source: mockSource, enabled: false }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeriesCategories).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    const mockError = new Error('Network error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesCategories({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useSeriesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches series successfully', async () => {
    const mockGetSeries = vi.fn().mockResolvedValue(mockSeries)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesList({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSeries)
    expect(mockGetSeries).toHaveBeenCalledTimes(1)
    expect(mockGetSeries).toHaveBeenCalledWith()
  })

  it('does not fetch when source is null', () => {
    const mockGetSeries = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesList({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeries).not.toHaveBeenCalled()
  })
})

describe('useSeriesByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches series for a category successfully', async () => {
    const mockGetSeries = vi.fn().mockResolvedValue(mockDramaSeries)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesByCategory({ source: mockSource, categoryId: '1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockDramaSeries)
    expect(mockGetSeries).toHaveBeenCalledWith('1')
  })

  it('does not fetch when categoryId is null', () => {
    const mockGetSeries = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesByCategory({ source: mockSource, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeries).not.toHaveBeenCalled()
  })

  it('does not fetch when both source and categoryId are null', () => {
    const mockGetSeries = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesByCategory({ source: null, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeries).not.toHaveBeenCalled()
  })
})

describe('useSeriesInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches series info successfully', async () => {
    const mockGetSeriesInfo = vi.fn().mockResolvedValue(mockSeriesInfo)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesInfo: mockGetSeriesInfo,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesInfo({ source: mockSource, seriesId: 'series1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockSeriesInfo)
    expect(mockGetSeriesInfo).toHaveBeenCalledWith('series1')
  })

  it('does not fetch when seriesId is null', () => {
    const mockGetSeriesInfo = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesInfo: mockGetSeriesInfo,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesInfo({ source: mockSource, seriesId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeriesInfo).not.toHaveBeenCalled()
  })

  it('does not fetch when source is null', () => {
    const mockGetSeriesInfo = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesInfo: mockGetSeriesInfo,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesInfo({ source: null, seriesId: 'series1' }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetSeriesInfo).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    const mockError = new Error('Series not found')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesInfo: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useSeriesInfo({ source: mockSource, seriesId: 'series1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Series not found')
  })
})

describe('useSeriesContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches both categories and series', async () => {
    const mockGetSeriesCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetSeries = vi.fn().mockResolvedValue(mockSeries)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesContent({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.series).toEqual(mockSeries)
    expect(result.current.error).toBeNull()
  })

  it('returns empty arrays when source is null', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesContent({ source: null }), { wrapper })

    expect(result.current.categories).toEqual([])
    expect(result.current.series).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('reports error from categories query', async () => {
    const mockError = new Error('Categories error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: vi.fn().mockRejectedValue(mockError),
          getSeries: vi.fn().mockResolvedValue(mockSeries),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Categories error')
  })

  it('reports error from series query', async () => {
    const mockError = new Error('Series error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: vi.fn().mockResolvedValue(mockCategories),
          getSeries: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useSeriesContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Series error')
  })
})

describe('usePrefetchSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches categories and series', async () => {
    const mockGetSeriesCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetSeries = vi.fn().mockResolvedValue(mockSeries)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
          getSeries: mockGetSeries,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchSeries(), { wrapper })

    await result.current(mockSource)

    // Check that data is in cache
    const cachedCategories = queryClient.getQueryData(seriesKeys.categories(mockSource.id))
    const cachedSeries = queryClient.getQueryData(seriesKeys.seriesList(mockSource.id))

    expect(cachedCategories).toEqual(mockCategories)
    expect(cachedSeries).toEqual(mockSeries)
  })
})

describe('usePrefetchSeriesInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches series info', async () => {
    const mockGetSeriesInfo = vi.fn().mockResolvedValue(mockSeriesInfo)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesInfo: mockGetSeriesInfo,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchSeriesInfo(), { wrapper })

    await result.current(mockSource, 'series1')

    // Check that data is in cache
    const cachedInfo = queryClient.getQueryData(seriesKeys.seriesInfo(mockSource.id, 'series1'))

    expect(cachedInfo).toEqual(mockSeriesInfo)
    expect(mockGetSeriesInfo).toHaveBeenCalledWith('series1')
  })
})

describe('useInvalidateSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates series caches for a source', async () => {
    const mockGetSeriesCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetSeries = vi.fn().mockResolvedValue(mockSeries)
    const mockGetSeriesInfo = vi.fn().mockResolvedValue(mockSeriesInfo)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getSeriesCategories: mockGetSeriesCategories,
          getSeries: mockGetSeries,
          getSeriesInfo: mockGetSeriesInfo,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    // First, populate the cache
    queryClient.setQueryData(seriesKeys.categories(mockSource.id), mockCategories)
    queryClient.setQueryData(seriesKeys.seriesList(mockSource.id), mockSeries)
    queryClient.setQueryData(seriesKeys.seriesInfo(mockSource.id, 'series1'), mockSeriesInfo)

    const { result } = renderHook(() => useInvalidateSeries(), { wrapper })

    await result.current(mockSource.id)

    // Check that queries are invalidated (stale)
    const categoriesState = queryClient.getQueryState(seriesKeys.categories(mockSource.id))
    const seriesState = queryClient.getQueryState(seriesKeys.seriesList(mockSource.id))
    const infoState = queryClient.getQueryState(seriesKeys.seriesInfo(mockSource.id, 'series1'))

    expect(categoriesState?.isInvalidated).toBe(true)
    expect(seriesState?.isInvalidated).toBe(true)
    expect(infoState?.isInvalidated).toBe(true)
  })
})

describe('useClearSeriesCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears all series caches', async () => {
    const { wrapper, queryClient } = createWrapper()

    // Populate the cache with multiple sources
    queryClient.setQueryData(seriesKeys.categories('source-1'), mockCategories)
    queryClient.setQueryData(seriesKeys.seriesList('source-1'), mockSeries)
    queryClient.setQueryData(seriesKeys.seriesInfo('source-1', 'series1'), mockSeriesInfo)
    queryClient.setQueryData(seriesKeys.categories('source-2'), mockCategories)
    queryClient.setQueryData(seriesKeys.seriesList('source-2'), mockSeries)

    const { result } = renderHook(() => useClearSeriesCache(), { wrapper })

    result.current()

    // Check that all series caches are removed
    expect(queryClient.getQueryData(seriesKeys.categories('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(seriesKeys.seriesList('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(seriesKeys.seriesInfo('source-1', 'series1'))).toBeUndefined()
    expect(queryClient.getQueryData(seriesKeys.categories('source-2'))).toBeUndefined()
    expect(queryClient.getQueryData(seriesKeys.seriesList('source-2'))).toBeUndefined()
  })
})
