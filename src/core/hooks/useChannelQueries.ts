/**
 * React Query hooks for fetching channel data with caching
 *
 * These hooks provide a unified interface for fetching live TV channels
 * and categories from any IPTV source (Xtream or M3U).
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import type { Category, Channel } from '../types/channel'
import type { Source } from '../types/source'
import { SourceNormalizer } from '../api/sourceNormalizer'

/**
 * Query key factory for channel-related queries
 */
export const channelKeys = {
  all: ['channels'] as const,
  categories: (sourceId: string) => [...channelKeys.all, 'categories', sourceId] as const,
  channelList: (sourceId: string) => [...channelKeys.all, 'list', sourceId] as const,
  channelsByCategory: (sourceId: string, categoryId: string) =>
    [...channelKeys.all, 'list', sourceId, categoryId] as const,
  channel: (sourceId: string, channelId: string) =>
    [...channelKeys.all, 'detail', sourceId, channelId] as const,
}

/**
 * Cache time constants (in milliseconds)
 */
const CACHE_TIME = {
  /** Categories are relatively stable, cache for 30 minutes */
  CATEGORIES: 30 * 60 * 1000,
  /** Channel lists may change more frequently, cache for 10 minutes */
  CHANNELS: 10 * 60 * 1000,
  /** Stale time - consider data stale after this duration */
  STALE_TIME: 5 * 60 * 1000,
}

/**
 * Creates a SourceNormalizer instance for the given source
 */
function createNormalizer(source: Source): SourceNormalizer {
  return new SourceNormalizer(source)
}

/**
 * Options for channel query hooks
 */
export interface UseChannelQueryOptions<T> {
  /** The IPTV source to fetch from */
  source: Source | null
  /** Whether the query should be enabled */
  enabled?: boolean
  /** Custom stale time in milliseconds */
  staleTime?: number
  /** Custom cache time in milliseconds */
  gcTime?: number
  /** Additional React Query options */
  queryOptions?: Omit<
    UseQueryOptions<T, Error>,
    'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'gcTime'
  >
}

/**
 * Hook to fetch all live TV categories for a source
 *
 * @example
 * ```tsx
 * const { data: categories, isLoading, error } = useLiveCategories({
 *   source: currentSource,
 * })
 * ```
 */
export function useLiveCategories(options: UseChannelQueryOptions<Category[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Category[], Error>({
    queryKey: channelKeys.categories(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getLiveCategories()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CATEGORIES,
    ...queryOptions,
  })
}

/**
 * Hook to fetch all live TV channels for a source
 *
 * @example
 * ```tsx
 * const { data: channels, isLoading, error } = useLiveChannels({
 *   source: currentSource,
 * })
 * ```
 */
export function useLiveChannels(options: UseChannelQueryOptions<Channel[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Channel[], Error>({
    queryKey: channelKeys.channelList(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getLiveChannels()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CHANNELS,
    ...queryOptions,
  })
}

/**
 * Options for fetching channels by category
 */
export interface UseChannelsByCategoryOptions extends UseChannelQueryOptions<Channel[]> {
  /** Category ID to filter channels */
  categoryId: string | null
}

/**
 * Hook to fetch live TV channels for a specific category
 *
 * @example
 * ```tsx
 * const { data: channels, isLoading, error } = useLiveChannelsByCategory({
 *   source: currentSource,
 *   categoryId: selectedCategoryId,
 * })
 * ```
 */
export function useLiveChannelsByCategory(options: UseChannelsByCategoryOptions) {
  const { source, categoryId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Channel[], Error>({
    queryKey: channelKeys.channelsByCategory(source?.id ?? '', categoryId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!categoryId) {
        throw new Error('No category ID provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getLiveChannels(categoryId)
    },
    enabled: enabled && source !== null && categoryId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CHANNELS,
    ...queryOptions,
  })
}

/**
 * Hook to fetch both categories and channels for a source
 *
 * This is useful when you need both data sets and want to
 * minimize loading states in the UI.
 *
 * @example
 * ```tsx
 * const { categories, channels, isLoading, error } = useLiveContent({
 *   source: currentSource,
 * })
 * ```
 */
export function useLiveContent(options: UseChannelQueryOptions<void>) {
  const { source, enabled = true, staleTime, gcTime } = options

  const categoriesQuery = useLiveCategories({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  const channelsQuery = useLiveChannels({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  return {
    categories: categoriesQuery.data ?? [],
    channels: channelsQuery.data ?? [],
    isLoading: categoriesQuery.isLoading || channelsQuery.isLoading,
    isFetching: categoriesQuery.isFetching || channelsQuery.isFetching,
    error: categoriesQuery.error || channelsQuery.error,
    categoriesQuery,
    channelsQuery,
  }
}

/**
 * Hook to prefetch channel data for a source
 *
 * Useful for preloading data before navigation
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetchChannels()
 * // Later, when user hovers over Live TV button:
 * prefetch(currentSource)
 * ```
 */
export function usePrefetchChannels() {
  const queryClient = useQueryClient()

  return async (source: Source) => {
    const normalizer = createNormalizer(source)

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: channelKeys.categories(source.id),
        queryFn: () => normalizer.getLiveCategories(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.CATEGORIES,
      }),
      queryClient.prefetchQuery({
        queryKey: channelKeys.channelList(source.id),
        queryFn: () => normalizer.getLiveChannels(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.CHANNELS,
      }),
    ])
  }
}

/**
 * Hook to invalidate all channel caches for a source
 *
 * Useful when the source is updated or user requests a refresh
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateChannels()
 * // When user clicks refresh:
 * invalidate(currentSource.id)
 * ```
 */
export function useInvalidateChannels() {
  const queryClient = useQueryClient()

  return async (sourceId: string) => {
    await queryClient.invalidateQueries({
      queryKey: [...channelKeys.all, 'categories', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...channelKeys.all, 'list', sourceId],
    })
  }
}

/**
 * Hook to clear all channel caches
 *
 * Useful when switching sources or logging out
 *
 * @example
 * ```tsx
 * const clearCache = useClearChannelCache()
 * // When switching sources:
 * clearCache()
 * ```
 */
export function useClearChannelCache() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.removeQueries({
      queryKey: channelKeys.all,
    })
  }
}
