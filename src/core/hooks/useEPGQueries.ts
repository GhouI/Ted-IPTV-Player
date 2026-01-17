/**
 * React Query hooks for fetching EPG (Electronic Program Guide) data with caching
 *
 * These hooks provide a unified interface for fetching EPG data from sources.
 * Xtream sources use the API directly, while M3U sources need external EPG parsing.
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import type { Program, EPGData } from '../types/channel'
import type { Source } from '../types/source'
import { SourceNormalizer } from '../api/sourceNormalizer'

/**
 * Query key factory for EPG-related queries
 */
export const epgKeys = {
  all: ['epg'] as const,
  fullGuide: (sourceId: string) => [...epgKeys.all, 'full', sourceId] as const,
  channelPrograms: (sourceId: string, channelId: string) =>
    [...epgKeys.all, 'channel', sourceId, channelId] as const,
  currentProgram: (sourceId: string, channelId: string) =>
    [...epgKeys.all, 'current', sourceId, channelId] as const,
  timeRange: (sourceId: string, startTime: number, endTime: number) =>
    [...epgKeys.all, 'range', sourceId, startTime, endTime] as const,
}

/**
 * Cache time constants (in milliseconds)
 */
const CACHE_TIME = {
  /** Full EPG data, cache for 30 minutes */
  FULL_GUIDE: 30 * 60 * 1000,
  /** Channel programs, cache for 15 minutes */
  CHANNEL_PROGRAMS: 15 * 60 * 1000,
  /** Current program, cache for 2 minutes (changes frequently) */
  CURRENT_PROGRAM: 2 * 60 * 1000,
  /** Time range queries, cache for 10 minutes */
  TIME_RANGE: 10 * 60 * 1000,
  /** Stale time - consider data stale after this duration */
  STALE_TIME: 1 * 60 * 1000,
}

/**
 * Creates a SourceNormalizer instance for the given source
 */
function createNormalizer(source: Source): SourceNormalizer {
  return new SourceNormalizer(source)
}

/**
 * Options for EPG query hooks
 */
export interface UseEPGQueryOptions<T> {
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
 * Hook to fetch full EPG data for all channels from a source
 *
 * @example
 * ```tsx
 * const { data: epgData, isLoading, error } = useFullEPG({
 *   source: currentSource,
 * })
 *
 * if (epgData) {
 *   const channelPrograms = epgData.programs['channel-1']
 * }
 * ```
 */
export function useFullEPG(options: UseEPGQueryOptions<EPGData>) {
  const { source, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<EPGData, Error>({
    queryKey: epgKeys.fullGuide(source?.id ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      const normalizer = createNormalizer(source)
      return normalizer.getEPG()
    },
    enabled: enabled && source !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.FULL_GUIDE,
    ...queryOptions,
  })
}

/**
 * Options for fetching EPG for a specific channel
 */
export interface UseChannelEPGOptions extends UseEPGQueryOptions<Program[]> {
  /** Channel ID to fetch EPG for */
  channelId: string | null
}

/**
 * Hook to fetch EPG data for a specific channel
 *
 * @example
 * ```tsx
 * const { data: programs, isLoading, error } = useChannelEPG({
 *   source: currentSource,
 *   channelId: selectedChannelId,
 * })
 *
 * if (programs) {
 *   programs.forEach(p => console.log(p.title, p.startTime))
 * }
 * ```
 */
export function useChannelEPG(options: UseChannelEPGOptions) {
  const { source, channelId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Program[], Error>({
    queryKey: epgKeys.channelPrograms(source?.id ?? '', channelId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!channelId) {
        throw new Error('No channel ID provided')
      }
      const normalizer = createNormalizer(source)
      const epgData = await normalizer.getEPG(channelId)
      return epgData.programs[channelId] || []
    },
    enabled: enabled && source !== null && channelId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CHANNEL_PROGRAMS,
    ...queryOptions,
  })
}

/**
 * Hook to get the current playing program for a channel
 *
 * @example
 * ```tsx
 * const { data: currentProgram, isLoading } = useCurrentProgram({
 *   source: currentSource,
 *   channelId: selectedChannelId,
 * })
 *
 * if (currentProgram) {
 *   console.log('Now playing:', currentProgram.title)
 * }
 * ```
 */
export function useCurrentProgram(options: UseChannelEPGOptions) {
  const { source, channelId, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Program | null, Error>({
    queryKey: epgKeys.currentProgram(source?.id ?? '', channelId ?? ''),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (!channelId) {
        throw new Error('No channel ID provided')
      }
      const normalizer = createNormalizer(source)
      const epgData = await normalizer.getEPG(channelId)
      const programs = epgData.programs[channelId] || []

      const now = Date.now()
      return (
        programs.find((program) => {
          const start = toTimestamp(program.startTime)
          const end = toTimestamp(program.endTime)
          return now >= start && now < end
        }) || null
      )
    },
    enabled: enabled && source !== null && channelId !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CURRENT_PROGRAM,
    // Refetch more frequently for current program data
    refetchInterval: 60 * 1000, // 1 minute
    ...queryOptions,
  })
}

/**
 * Options for fetching EPG in a time range
 */
export interface UseEPGTimeRangeOptions extends UseEPGQueryOptions<EPGData> {
  /** Start time of the range (Unix timestamp in ms) */
  startTime: number | null
  /** End time of the range (Unix timestamp in ms) */
  endTime: number | null
}

/**
 * Hook to fetch EPG data for a specific time range
 *
 * Useful for EPG grid views that only show a portion of the schedule
 *
 * @example
 * ```tsx
 * const now = Date.now()
 * const twoHoursLater = now + 2 * 60 * 60 * 1000
 *
 * const { data: epgData } = useEPGTimeRange({
 *   source: currentSource,
 *   startTime: now,
 *   endTime: twoHoursLater,
 * })
 * ```
 */
export function useEPGTimeRange(options: UseEPGTimeRangeOptions) {
  const { source, startTime, endTime, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<EPGData, Error>({
    queryKey: epgKeys.timeRange(source?.id ?? '', startTime ?? 0, endTime ?? 0),
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }
      if (startTime === null || endTime === null) {
        throw new Error('Time range not provided')
      }

      const normalizer = createNormalizer(source)
      const epgData = await normalizer.getEPG()

      // Filter programs to only include those in the time range
      const filteredPrograms: Record<string, Program[]> = {}

      for (const [channelId, programs] of Object.entries(epgData.programs)) {
        const inRange = programs.filter((program) => {
          const programStart = toTimestamp(program.startTime)
          const programEnd = toTimestamp(program.endTime)
          // Program overlaps with range if it starts before range ends
          // and ends after range starts
          return programStart < endTime && programEnd > startTime
        })

        if (inRange.length > 0) {
          filteredPrograms[channelId] = inRange
        }
      }

      return {
        programs: filteredPrograms,
        lastUpdated: epgData.lastUpdated,
        source: epgData.source,
      }
    },
    enabled: enabled && source !== null && startTime !== null && endTime !== null,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.TIME_RANGE,
    ...queryOptions,
  })
}

/**
 * Helper to convert time to timestamp
 */
function toTimestamp(time: string | number): number {
  if (typeof time === 'number') {
    return time
  }
  return new Date(time).getTime()
}

/**
 * Hook to get now playing and next programs for multiple channels
 *
 * Useful for showing mini EPG info on channel cards/list
 *
 * @example
 * ```tsx
 * const { data: nowNext } = useNowNextPrograms({
 *   source: currentSource,
 *   channelIds: ['ch1', 'ch2', 'ch3'],
 * })
 *
 * if (nowNext) {
 *   nowNext['ch1']?.now // Current program
 *   nowNext['ch1']?.next // Next program
 * }
 * ```
 */
export interface UseNowNextOptions extends UseEPGQueryOptions<Record<string, NowNextPrograms>> {
  /** Channel IDs to fetch now/next for */
  channelIds: string[]
}

export interface NowNextPrograms {
  /** Currently playing program */
  now: Program | null
  /** Next upcoming program */
  next: Program | null
}

export function useNowNextPrograms(options: UseNowNextOptions) {
  const { source, channelIds, enabled = true, staleTime, gcTime, queryOptions } = options

  return useQuery<Record<string, NowNextPrograms>, Error>({
    queryKey: [...epgKeys.all, 'now-next', source?.id ?? '', channelIds.join(',')],
    queryFn: async () => {
      if (!source) {
        throw new Error('No source provided')
      }

      const normalizer = createNormalizer(source)
      const epgData = await normalizer.getEPG()
      const now = Date.now()
      const result: Record<string, NowNextPrograms> = {}

      for (const channelId of channelIds) {
        const programs = epgData.programs[channelId] || []

        // Find current program
        const currentProgram = programs.find((program) => {
          const start = toTimestamp(program.startTime)
          const end = toTimestamp(program.endTime)
          return now >= start && now < end
        })

        // Find next program (first one that starts after now)
        const sortedPrograms = [...programs].sort(
          (a, b) => toTimestamp(a.startTime) - toTimestamp(b.startTime)
        )
        const nextProgram = sortedPrograms.find((program) => {
          const start = toTimestamp(program.startTime)
          return start > now
        })

        result[channelId] = {
          now: currentProgram || null,
          next: nextProgram || null,
        }
      }

      return result
    },
    enabled: enabled && source !== null && channelIds.length > 0,
    staleTime: staleTime ?? CACHE_TIME.STALE_TIME,
    gcTime: gcTime ?? CACHE_TIME.CURRENT_PROGRAM,
    refetchInterval: 60 * 1000, // 1 minute
    ...queryOptions,
  })
}

/**
 * Hook to prefetch EPG data for a source
 *
 * Useful for preloading data before navigation
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetchEPG()
 * // Later, when user hovers over EPG button:
 * prefetch(currentSource)
 * ```
 */
export function usePrefetchEPG() {
  const queryClient = useQueryClient()

  return async (source: Source) => {
    const normalizer = createNormalizer(source)

    await queryClient.prefetchQuery({
      queryKey: epgKeys.fullGuide(source.id),
      queryFn: () => normalizer.getEPG(),
      staleTime: CACHE_TIME.STALE_TIME,
      gcTime: CACHE_TIME.FULL_GUIDE,
    })
  }
}

/**
 * Hook to prefetch EPG data for a specific channel
 *
 * @example
 * ```tsx
 * const prefetchChannel = usePrefetchChannelEPG()
 * // Later, when user hovers over a channel:
 * prefetchChannel(currentSource, channelId)
 * ```
 */
export function usePrefetchChannelEPG() {
  const queryClient = useQueryClient()

  return async (source: Source, channelId: string) => {
    const normalizer = createNormalizer(source)

    await queryClient.prefetchQuery({
      queryKey: epgKeys.channelPrograms(source.id, channelId),
      queryFn: async () => {
        const epgData = await normalizer.getEPG(channelId)
        return epgData.programs[channelId] || []
      },
      staleTime: CACHE_TIME.STALE_TIME,
      gcTime: CACHE_TIME.CHANNEL_PROGRAMS,
    })
  }
}

/**
 * Hook to invalidate all EPG caches for a source
 *
 * Useful when the source is updated or user requests a refresh
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateEPG()
 * // When user clicks refresh:
 * invalidate(currentSource.id)
 * ```
 */
export function useInvalidateEPG() {
  const queryClient = useQueryClient()

  return async (sourceId: string) => {
    await queryClient.invalidateQueries({
      queryKey: [...epgKeys.all, 'full', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...epgKeys.all, 'channel', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...epgKeys.all, 'current', sourceId],
    })
    await queryClient.invalidateQueries({
      queryKey: [...epgKeys.all, 'range', sourceId],
    })
  }
}

/**
 * Hook to clear all EPG caches
 *
 * Useful when switching sources or logging out
 *
 * @example
 * ```tsx
 * const clearCache = useClearEPGCache()
 * // When switching sources:
 * clearCache()
 * ```
 */
export function useClearEPGCache() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.removeQueries({
      queryKey: epgKeys.all,
    })
  }
}
