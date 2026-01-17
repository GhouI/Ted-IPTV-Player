/**
 * React Query hooks for fetching VOD content with caching
 *
 * These hooks provide a unified interface for fetching VOD (Video on Demand)
 * movies and categories from Xtream sources. M3U sources do not support VOD.
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import type { VODCategory, VODItem } from '../types/vod'
import type { Source } from '../types/source'
import { SourceNormalizer } from '../api/sourceNormalizer'

/**
 * Query key factory for VOD-related queries
 */
export const vodKeys = {
  all: ['vod'] as const,
  categories: (sourceId: string) => [...vodKeys.all, 'categories', sourceId] as const,
  itemList: (sourceId: string) => [...vodKeys.all, 'items', sourceId] as const,
  itemsByCategory: (sourceId: string, categoryId: string) =>
    [...vodKeys.all, 'items', sourceId, categoryId] as const,
  item: (sourceId: string, itemId: string) =>
    [...vodKeys.all, 'detail', sourceId, itemId] as const,
}

/**
 * Cache time constants (in milliseconds)
 */
const CACHE_TIME = {
  /** Categories are relatively stable, cache for 30 minutes */
  CATEGORIES: 30 * 60 * 1000,
  /** VOD items may change more frequently, cache for 10 minutes */
  ITEMS: 10 * 60 * 1000,
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
 * Options for VOD query hooks
 */
export interface UseVODQueryOptions<T> {
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
 * Hook to fetch all VOD categories for a source
 *
 * @example
 * ```tsx
 * const { data: categories, isLoading, error } = useVODCategories({
 *   source: currentSource,
 * })
 * ```
 */
export function useVODCategories(options: UseVODQueryOptions<VODCategory[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<VODCategory[], Error>({
    queryKey: vodKeys.categories(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getVODCategories()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CATEGORIES,
    ...queryOptions,
  })
}

/**
 * Hook to fetch all VOD items (movies) for a source
 *
 * @example
 * ```tsx
 * const { data: movies, isLoading, error } = useVODItems({
 *   source: currentSource,
 * })
 * ```
 */
export function useVODItems(options: UseVODQueryOptions<VODItem[]>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<VODItem[], Error>({
    queryKey: vodKeys.itemList(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getVODItems()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.ITEMS,
    ...queryOptions,
  })
}

/**
 * Options for fetching VOD items by category
 */
export interface UseVODItemsByCategoryOptions extends UseVODQueryOptions<VODItem[]> {
  /** Category ID to filter items */
  categoryId: string | null
}

/**
 * Hook to fetch VOD items for a specific category
 *
 * @example
 * ```tsx
 * const { data: movies, isLoading, error } = useVODItemsByCategory({
 *   source: currentSource,
 *   categoryId: selectedCategoryId,
 * })
 * ```
 */
export function useVODItemsByCategory(options: UseVODItemsByCategoryOptions) {
  const { source, categoryId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<VODItem[], Error>({
    queryKey: vodKeys.itemsByCategory(source?.id ?? '', categoryId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!categoryId) {
        throw new Error('No category ID provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getVODItems(categoryId)
    },
    enabled: enabled && source !== null && categoryId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.ITEMS,
    ...queryOptions,
  })
}

/**
 * Hook to fetch both categories and items for a source
 *
 * This is useful when you need both data sets and want to
 * minimize loading states in the UI.
 *
 * @example
 * ```tsx
 * const { categories, items, isLoading, error } = useVODContent({
 *   source: currentSource,
 * })
 * ```
 */
export function useVODContent(options: UseVODQueryOptions<void>) {
  const { source, enabled = true, staleTime, gcTime } = options

  const categoriesQuery = useVODCategories({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  const itemsQuery = useVODItems({
    source,
    enabled,
    staleTime,
    gcTime,
  })

  return {
    categories: categoriesQuery.data ?? [],
    items: itemsQuery.data ?? [],
    isLoading: categoriesQuery.isLoading || itemsQuery.isLoading,
    isFetching: categoriesQuery.isFetching || itemsQuery.isFetching,
    error: categoriesQuery.error || itemsQuery.error,
    categoriesQuery,
    itemsQuery,
  }
}

/**
 * Hook to prefetch VOD data for a source
 *
 * Useful for preloading data before navigation
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetchVOD()
 * // Later, when user hovers over VOD button:
 * prefetch(currentSource)
 * ```
 */
export function usePrefetchVOD() {
  const queryClient = useQueryClient()

  return async (source: Source) => {
    const normalizer = createNormalizer(source)

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: vodKeys.categories(source.id),
        queryFn: () => normalizer.getVODCategories(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.CATEGORIES,
      }),
      queryClient.prefetchQuery({
        queryKey: vodKeys.itemList(source.id),
        queryFn: () => normalizer.getVODItems(),
        staleTime: CACHE_TIME.STALE_TIME,
        gcTime: CACHE_TIME.ITEMS,
      }),
    ])
  }
}

/**
 * Hook to invalidate all VOD caches for a source
 *
 * Useful when the source is updated or user requests a refresh
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateVOD()
 * // When user clicks refresh:
 * invalidate(currentSource.id)
 * ```
 */
export function useInvalidateVOD() {
  const queryClient = useQueryClient()

  return async (sourceId: string) => {
    await queryClient.invalidateQueries({
      queryKey: [...vodKeys.all, 'categories', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...vodKeys.all, 'items', sourceId],
    })
  }
}

/**
 * Hook to clear all VOD caches
 *
 * Useful when switching sources or logging out
 *
 * @example
 * ```tsx
 * const clearCache = useClearVODCache()
 * // When switching sources:
 * clearCache()
 * ```
 */
export function useClearVODCache() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.removeQueries({
      queryKey: vodKeys.all,
    })
  }
}
