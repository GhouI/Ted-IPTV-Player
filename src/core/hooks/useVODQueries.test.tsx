import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  vodKeys,
  useVODCategories,
  useVODItems,
  useVODItemsByCategory,
  useVODContent,
  usePrefetchVOD,
  useInvalidateVOD,
  useClearVODCache,
} from './useVODQueries'
import type { Source } from '../types/source'
import type { VODCategory, VODItem } from '../types/vod'
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
  { id: '1', name: 'Action' },
  { id: '2', name: 'Comedy' },
  { id: '3', name: 'Drama' },
]

const mockItems: VODItem[] = [
  {
    id: 'vod1',
    title: 'Action Movie',
    categoryId: '1',
    streamUrl: 'http://example.com/vod/1',
    description: 'An action packed movie',
    year: 2024,
  },
  {
    id: 'vod2',
    title: 'Comedy Film',
    categoryId: '2',
    streamUrl: 'http://example.com/vod/2',
    description: 'A funny movie',
    year: 2023,
  },
  {
    id: 'vod3',
    title: 'Drama Story',
    categoryId: '3',
    streamUrl: 'http://example.com/vod/3',
    description: 'A dramatic tale',
    year: 2024,
  },
]

const mockActionItems: VODItem[] = [
  {
    id: 'vod1',
    title: 'Action Movie',
    categoryId: '1',
    streamUrl: 'http://example.com/vod/1',
    description: 'An action packed movie',
    year: 2024,
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

describe('vodKeys', () => {
  it('generates correct query keys', () => {
    expect(vodKeys.all).toEqual(['vod'])
    expect(vodKeys.categories('source-1')).toEqual(['vod', 'categories', 'source-1'])
    expect(vodKeys.itemList('source-1')).toEqual(['vod', 'items', 'source-1'])
    expect(vodKeys.itemsByCategory('source-1', 'cat-1')).toEqual([
      'vod',
      'items',
      'source-1',
      'cat-1',
    ])
    expect(vodKeys.item('source-1', 'item-1')).toEqual(['vod', 'detail', 'source-1', 'item-1'])
  })
})

describe('useVODCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches categories successfully', async () => {
    const mockGetVODCategories = vi.fn().mockResolvedValue(mockCategories)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODCategories({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCategories)
    expect(mockGetVODCategories).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when source is null', () => {
    const mockGetVODCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODCategories({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetVODCategories).not.toHaveBeenCalled()
  })

  it('does not fetch when enabled is false', () => {
    const mockGetVODCategories = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useVODCategories({ source: mockSource, enabled: false }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetVODCategories).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    const mockError = new Error('Network error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODCategories({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useVODItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches items successfully', async () => {
    const mockGetVODItems = vi.fn().mockResolvedValue(mockItems)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODItems({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockItems)
    expect(mockGetVODItems).toHaveBeenCalledTimes(1)
    expect(mockGetVODItems).toHaveBeenCalledWith()
  })

  it('does not fetch when source is null', () => {
    const mockGetVODItems = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODItems({ source: null }), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetVODItems).not.toHaveBeenCalled()
  })
})

describe('useVODItemsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches items for a category successfully', async () => {
    const mockGetVODItems = vi.fn().mockResolvedValue(mockActionItems)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useVODItemsByCategory({ source: mockSource, categoryId: '1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockActionItems)
    expect(mockGetVODItems).toHaveBeenCalledWith('1')
  })

  it('does not fetch when categoryId is null', () => {
    const mockGetVODItems = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useVODItemsByCategory({ source: mockSource, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetVODItems).not.toHaveBeenCalled()
  })

  it('does not fetch when both source and categoryId are null', () => {
    const mockGetVODItems = vi.fn()
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useVODItemsByCategory({ source: null, categoryId: null }),
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
    expect(mockGetVODItems).not.toHaveBeenCalled()
  })
})

describe('useVODContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches both categories and items', async () => {
    const mockGetVODCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetVODItems = vi.fn().mockResolvedValue(mockItems)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODContent({ source: mockSource }), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.items).toEqual(mockItems)
    expect(result.current.error).toBeNull()
  })

  it('returns empty arrays when source is null', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODContent({ source: null }), { wrapper })

    expect(result.current.categories).toEqual([])
    expect(result.current.items).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('reports error from categories query', async () => {
    const mockError = new Error('Categories error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: vi.fn().mockRejectedValue(mockError),
          getVODItems: vi.fn().mockResolvedValue(mockItems),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Categories error')
  })

  it('reports error from items query', async () => {
    const mockError = new Error('Items error')
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: vi.fn().mockResolvedValue(mockCategories),
          getVODItems: vi.fn().mockRejectedValue(mockError),
        }) as unknown as SourceNormalizer
    )

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useVODContent({ source: mockSource }), { wrapper })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error?.message).toBe('Items error')
  })
})

describe('usePrefetchVOD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefetches categories and items', async () => {
    const mockGetVODCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetVODItems = vi.fn().mockResolvedValue(mockItems)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    const { result } = renderHook(() => usePrefetchVOD(), { wrapper })

    await result.current(mockSource)

    // Check that data is in cache
    const cachedCategories = queryClient.getQueryData(vodKeys.categories(mockSource.id))
    const cachedItems = queryClient.getQueryData(vodKeys.itemList(mockSource.id))

    expect(cachedCategories).toEqual(mockCategories)
    expect(cachedItems).toEqual(mockItems)
  })
})

describe('useInvalidateVOD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates VOD caches for a source', async () => {
    const mockGetVODCategories = vi.fn().mockResolvedValue(mockCategories)
    const mockGetVODItems = vi.fn().mockResolvedValue(mockItems)
    MockSourceNormalizer.mockImplementation(
      () =>
        ({
          getVODCategories: mockGetVODCategories,
          getVODItems: mockGetVODItems,
        }) as unknown as SourceNormalizer
    )

    const { wrapper, queryClient } = createWrapper()

    // First, populate the cache
    queryClient.setQueryData(vodKeys.categories(mockSource.id), mockCategories)
    queryClient.setQueryData(vodKeys.itemList(mockSource.id), mockItems)

    const { result } = renderHook(() => useInvalidateVOD(), { wrapper })

    await result.current(mockSource.id)

    // Check that queries are invalidated (stale)
    const categoriesState = queryClient.getQueryState(vodKeys.categories(mockSource.id))
    const itemsState = queryClient.getQueryState(vodKeys.itemList(mockSource.id))

    expect(categoriesState?.isInvalidated).toBe(true)
    expect(itemsState?.isInvalidated).toBe(true)
  })
})

describe('useClearVODCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears all VOD caches', async () => {
    const { wrapper, queryClient } = createWrapper()

    // Populate the cache with multiple sources
    queryClient.setQueryData(vodKeys.categories('source-1'), mockCategories)
    queryClient.setQueryData(vodKeys.itemList('source-1'), mockItems)
    queryClient.setQueryData(vodKeys.categories('source-2'), mockCategories)
    queryClient.setQueryData(vodKeys.itemList('source-2'), mockItems)

    const { result } = renderHook(() => useClearVODCache(), { wrapper })

    result.current()

    // Check that all VOD caches are removed
    expect(queryClient.getQueryData(vodKeys.categories('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(vodKeys.itemList('source-1'))).toBeUndefined()
    expect(queryClient.getQueryData(vodKeys.categories('source-2'))).toBeUndefined()
    expect(queryClient.getQueryData(vodKeys.itemList('source-2'))).toBeUndefined()
  })
})
