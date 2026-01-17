/**
 * React Query hooks for fetching series content with caching
 *
 * These hooks provide a unified interface for fetching TV series,
 * seasons, and episodes from Xtream sources. M3U sources do not support series.
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import type { VODCategory, Series, SeriesInfo } from '../types/vod'
import type { Source } from '../types/source'
import { SourceNormalizer } from '../api/sourceNormalizer'

/**
 * Query key factory for series-related queries
 */
export const seriesKeys = {
  all: ['series'] as const,
  categories: (sourceId: string) => [...seriesKeys.all, 'categories', sourceId] as const,
  seriesList: (sourceId: string) => [...seriesKeys.all, 'list', sourceId] as const,
  seriesByCategory: (sourceId: string, categoryId: string) =>
    [...seriesKeys.all, 'list', sourceId, categoryId] as const,
  seriesInfo: (sourceId: string, seriesId: string) =>
    [...seriesKeys.all, 'info', sourceId, seriesId] as const,
}

/**
 * Cache time constants (in milliseconds)
 */
const CACHE_TIME = {
  /** Categories are relatively stable, cache for 30 minutes */
  CATEGORIES: 30 * 60 * 1000,
  /** Series list may change more frequently, cache for 10 minutes */
  SERIES: 10 * 60 * 1000,
  /** Series info with episodes, cache for 15 minutes */
  SERIES_INFO: 15 * 60 * 1000,
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
 * Options for series query hooks
 */
export interface UseSeriesQueryOptions<T> {
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
 * Hook to fetch all series categories for a source
 *
 * @example
 * ```tsx
 * const { data: categories, isLoading, error } = useSeriesCategories({
 *   source: currentSource,
 * })
 * ```
 */
export function useSeriesCategories(options: UseSeriesQueryOptions<VODCategory[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<VODCategory[], Error>({
    queryKey: seriesKeys.categories(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getSeriesCategories()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CATEGORIES,
    ...queryOptions,
  })
}

/**
 * Hook to fetch all series for a source
 *
 * @example
 * ```tsx
 * const { data: seriesList, isLoading, error } = useSeriesList({
 *   source: currentSource,
 * })
 * ```
 */
export function useSeriesList(options: UseSeriesQueryOptions<Series[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Series[], Error>({
    queryKey: seriesKeys.seriesList(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getSeries()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.SERIES,
    ...queryOptions,
  })
}

/**
 * Options for fetching series by category
 */
export interface UseSeriesByCategoryOptions extends UseSeriesQueryOptions<Series[]> {
  /** Category ID to filter series */
  categoryId: string | null
}

/**
 * Hook to fetch series for a specific category
 *
 * @example
 * ```tsx
 * const { data: seriesList, isLoading, error } = useSeriesByCategory({
 *   source: currentSource,
 *   categoryId: selectedCategoryId,
 * })
 * ```
 */
export function useSeriesByCategory(options: UseSeriesByCategoryOptions) {
  const { source, categoryId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Series[], Error>({
    queryKey: seriesKeys.seriesByCategory(source?.id ?? '', categoryId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!categoryId) {
        throw new Error('No category ID provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getSeries(categoryId)
    },
    enabled: enabled && source !== null && categoryId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.SERIES,
    ...queryOptions,
  })
}

/**
 * Options for fetching series info
 */
export interface UseSeriesInfoOptions extends UseSeriesQueryOptions<SeriesInfo> {
  /** Series ID to fetch info for */
  seriesId: string | null
}

/**
 * Hook to fetch detailed series info including seasons and episodes
 *
 * @example
 * ```tsx
 * const { data: seriesInfo, isLoading, error } = useSeriesInfo({
 *   source: currentSource,
 *   seriesId: selectedSeriesId,
 * })
 *
 * if (seriesInfo) {
 *   console.log(seriesInfo.series.title)
 *   console.log(seriesInfo.seasons.length)
 *   console.log(seriesInfo.episodes)
 * }
 * ```
 */
export function useSeriesInfo(options: UseSeriesInfoOptions) {
  const { source, seriesId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<SeriesInfo, Error>({
    queryKey: seriesKeys.seriesInfo(source?.id ?? '', seriesId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!seriesId) {
        throw new Error('No series ID provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getSeriesInfo(seriesId)
    },
    enabled: enabled && source !== null && seriesId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.SERIES_INFO,
    ...queryOptions,
  })
}

/**
 * Hook to fetch both categories and series for a source
 *
 * This is useful when you need both data sets and want to
 * minimize loading states in the UI.
 *
 * @example
 * ```tsx
 * const { categories, series, isLoading, error } = useSeriesContent({
 *   source: currentSource,
 * })
 * ```
 */
export function useSeriesContent(options: UseSeriesQueryOptions<void>) {
  const { source, enabled = true, staleTime, gcTime } = options

  const categoriesQuery = useSeriesCategories({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  const seriesQuery = useSeriesList({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  return {
    categories: categoriesQuery.data ?? [],
    series: seriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading || seriesQuery.isLoading,
    isFetching: categoriesQuery.isFetching || seriesQuery.isFetching,
    error: categoriesQuery.error || seriesQuery.error,
    categoriesQuery,
    seriesQuery,
  }
}

/**
 * Hook to prefetch series data for a source
 *
 * Useful for preloading data before navigation
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetchSeries()
 * // Later, when user hovers over Series button:
 * prefetch(currentSource)
 * ```
 */
export function usePrefetchSeries() {
  const queryClient = useQueryClient()

  return async (source: Source) => {
    const normalizer = createNormalizer(source)

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: seriesKeys.categories(source.id),
        queryFn: () => normalizer.getSeriesCategories(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.CATEGORIES,
      }),
      queryClient.prefetchQuery({
        queryKey: seriesKeys.seriesList(source.id),
        queryFn: () => normalizer.getSeries(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.SERIES,
      }),
    ])
  }
}

/**
 * Hook to prefetch series info (seasons and episodes) for a specific series
 *
 * Useful for preloading data when user hovers over a series card
 *
 * @example
 * ```tsx
 * const prefetchInfo = usePrefetchSeriesInfo()
 * // Later, when user hovers over a series card:
 * prefetchInfo(currentSource, seriesId)
 * ```
 */
export function usePrefetchSeriesInfo() {
  const queryClient = useQueryClient()

  return async (source: Source, seriesId: string) => {
    const normalizer = createNormalizer(source)

    await queryClient.prefetchQuery({
      queryKey: seriesKeys.seriesInfo(source.id, seriesId),
      queryFn: () => normalizer.getSeriesInfo(seriesId),
      staleTime: CACHE_TIME.STALE_TIME,
      gcTime: CACHE_TIME.SERIES_INFO,
    })
  }
}

/**
 * Hook to invalidate all series caches for a source
 *
 * Useful when the source is updated or user requests a refresh
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateSeries()
 * // When user clicks refresh:
 * invalidate(currentSource.id)
 * ```
 */
export function useInvalidateSeries() {
  const queryClient = useQueryClient()

  return async (sourceId: string) => {
    await queryClient.invalidateQueries({
      queryKey: [...seriesKeys.all, 'categories', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...seriesKeys.all, 'list', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...seriesKeys.all, 'info', sourceId],
    })
  }
}

/**
 * Hook to clear all series caches
 *
 * Useful when switching sources or logging out
 *
 * @example
 * ```tsx
 * const clearCache = useClearSeriesCache()
 * // When switching sources:
 * clearCache()
 * ```
 */
export function useClearSeriesCache() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.removeQueries({
      queryKey: seriesKeys.all,
    })
  }
}
