/**
 * SourceNormalizer
 *
 * Provides a unified interface for fetching content from both Xtream and M3U sources.
 * This abstraction allows the application to work with both source types using the same API.
 */

import type { Source, M3USource, XtreamAuthResponse } from '../types/source'
import { isXtreamSource, isM3USource } from '../types/source'
import type { Category, Channel, EPGData } from '../types/channel'
import type { VODCategory, VODItem, Series, SeriesInfo } from '../types/vod'
import { XtreamClient, XtreamApiError } from './xtreamClient'
import { fetchAndParseM3U, M3UParseError } from './m3uParser'
import { adaptM3UPlaylist } from './m3uAdapter'
import type { M3UAdapterResult } from './m3uAdapter'

/**
 * Error thrown when source normalization fails
 */
export class SourceNormalizerError extends Error {
  constructor(
    message: string,
    public readonly sourceType: 'xtream' | 'm3u',
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'SourceNormalizerError'
  }
}

/**
 * Result of validating a source
 */
export interface SourceValidationResult {
  /** Whether the source is valid and accessible */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Authentication response for Xtream sources */
  authResponse?: XtreamAuthResponse
  /** Number of channels/items found */
  channelCount?: number
}

/**
 * Unified content result from any source type
 */
export interface NormalizedContent {
  /** Live TV categories */
  liveCategories: Category[]
  /** Live TV channels */
  liveChannels: Channel[]
  /** VOD categories (empty for M3U sources) */
  vodCategories: VODCategory[]
  /** VOD items (empty for M3U sources) */
  vodItems: VODItem[]
  /** Series categories (empty for M3U sources) */
  seriesCategories: VODCategory[]
  /** Series list (empty for M3U sources) */
  series: Series[]
  /** EPG URL if available */
  epgUrl?: string
}

/**
 * SourceNormalizer provides a unified interface for working with IPTV sources.
 *
 * It abstracts the differences between Xtream Codes API and M3U playlists,
 * allowing the application to use the same methods regardless of source type.
 *
 * @example
 * ```typescript
 * const source: Source = { type: 'xtream', ... }
 * const normalizer = new SourceNormalizer(source)
 *
 * // Validate the source
 * const validation = await normalizer.validate()
 * if (!validation.isValid) {
 *   console.error(validation.error)
 * }
 *
 * // Fetch channels
 * const channels = await normalizer.getLiveChannels()
 * ```
 */
export class SourceNormalizer {
  private readonly source: Source
  private xtreamClient: XtreamClient | null = null
  private m3uCache: M3UAdapterResult | null = null
  private m3uCacheTime: number = 0
  private readonly m3uCacheDuration: number = 5 * 60 * 1000 // 5 minutes

  constructor(source: Source) {
    this.source = source

    if (isXtreamSource(source)) {
      this.xtreamClient = XtreamClient.fromSource(source)
    }
  }

  /**
   * Gets the source type
   */
  getSourceType(): 'xtream' | 'm3u' {
    return this.source.type
  }

  /**
   * Gets the source ID
   */
  getSourceId(): string {
    return this.source.id
  }

  /**
   * Gets the source name
   */
  getSourceName(): string {
    return this.source.name
  }

  /**
   * Validates the source by attempting to connect and authenticate
   *
   * For Xtream sources: Attempts authentication with the server
   * For M3U sources: Fetches and parses the playlist
   */
  async validate(): Promise<SourceValidationResult> {
    try {
      if (isXtreamSource(this.source)) {
        return await this.validateXtream()
      } else if (isM3USource(this.source)) {
        return await this.validateM3U()
      }

      return {
        isValid: false,
        error: 'Unknown source type',
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validates an Xtream source by authenticating
   */
  private async validateXtream(): Promise<SourceValidationResult> {
    if (!this.xtreamClient) {
      return { isValid: false, error: 'Xtream client not initialized' }
    }

    try {
      const authResponse = await this.xtreamClient.authenticate()

      if (!this.xtreamClient.isAccountActive()) {
        return {
          isValid: false,
          error: 'Account is not active or has expired',
          authResponse,
        }
      }

      // Try to get channel count for feedback
      let channelCount: number | undefined
      try {
        const channels = await this.xtreamClient.getLiveStreams()
        channelCount = channels.length
      } catch {
        // Ignore - channel count is optional
      }

      return {
        isValid: true,
        authResponse,
        channelCount,
      }
    } catch (error) {
      if (error instanceof XtreamApiError) {
        return { isValid: false, error: error.message }
      }
      throw error
    }
  }

  /**
   * Validates an M3U source by fetching and parsing the playlist
   */
  private async validateM3U(): Promise<SourceValidationResult> {
    const m3uSource = this.source as M3USource

    try {
      const playlist = await fetchAndParseM3U(m3uSource.playlistUrl)
      const result = adaptM3UPlaylist(playlist, { sourceId: this.source.id })

      // Cache the result for subsequent calls
      this.m3uCache = result
      this.m3uCacheTime = Date.now()

      return {
        isValid: true,
        channelCount: result.channels.length,
      }
    } catch (error) {
      if (error instanceof M3UParseError) {
        return { isValid: false, error: error.message }
      }
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to fetch playlist',
      }
    }
  }

  /**
   * Fetches and caches M3U playlist data
   */
  private async getM3UData(): Promise<M3UAdapterResult> {
    // Check if cache is still valid
    if (this.m3uCache && Date.now() - this.m3uCacheTime < this.m3uCacheDuration) {
      return this.m3uCache
    }

    const m3uSource = this.source as M3USource

    try {
      const playlist = await fetchAndParseM3U(m3uSource.playlistUrl)
      const result = adaptM3UPlaylist(playlist, { sourceId: this.source.id })

      // Update cache
      this.m3uCache = result
      this.m3uCacheTime = Date.now()

      // Use EPG URL from source if not in playlist
      if (!result.epgUrl && m3uSource.epgUrl) {
        result.epgUrl = m3uSource.epgUrl
      }

      return result
    } catch (error) {
      throw new SourceNormalizerError(
        error instanceof Error ? error.message : 'Failed to fetch M3U playlist',
        'm3u',
        error
      )
    }
  }

  /**
   * Gets all live TV categories
   */
  async getLiveCategories(): Promise<Category[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getLiveCategories()
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch categories',
          'xtream',
          error
        )
      }
    }

    if (isM3USource(this.source)) {
      const data = await this.getM3UData()
      return data.categories
    }

    return []
  }

  /**
   * Gets all live TV channels
   *
   * @param categoryId - Optional category ID to filter channels
   */
  async getLiveChannels(categoryId?: string): Promise<Channel[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getLiveStreams(categoryId)
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch channels',
          'xtream',
          error
        )
      }
    }

    if (isM3USource(this.source)) {
      const data = await this.getM3UData()
      if (categoryId) {
        return data.channels.filter((ch) => ch.categoryId === categoryId)
      }
      return data.channels
    }

    return []
  }

  /**
   * Gets all VOD categories
   *
   * Note: M3U sources do not support VOD, returns empty array
   */
  async getVODCategories(): Promise<VODCategory[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getVODCategories()
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch VOD categories',
          'xtream',
          error
        )
      }
    }

    // M3U sources don't support VOD
    return []
  }

  /**
   * Gets all VOD items (movies)
   *
   * @param categoryId - Optional category ID to filter items
   *
   * Note: M3U sources do not support VOD, returns empty array
   */
  async getVODItems(categoryId?: string): Promise<VODItem[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getVODStreams(categoryId)
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch VOD items',
          'xtream',
          error
        )
      }
    }

    // M3U sources don't support VOD
    return []
  }

  /**
   * Gets all series categories
   *
   * Note: M3U sources do not support series, returns empty array
   */
  async getSeriesCategories(): Promise<VODCategory[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getSeriesCategories()
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch series categories',
          'xtream',
          error
        )
      }
    }

    // M3U sources don't support series
    return []
  }

  /**
   * Gets all series
   *
   * @param categoryId - Optional category ID to filter series
   *
   * Note: M3U sources do not support series, returns empty array
   */
  async getSeries(categoryId?: string): Promise<Series[]> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getSeries(categoryId)
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch series',
          'xtream',
          error
        )
      }
    }

    // M3U sources don't support series
    return []
  }

  /**
   * Gets detailed series info including seasons and episodes
   *
   * @param seriesId - The series ID to get info for
   *
   * Note: M3U sources do not support series, throws error
   */
  async getSeriesInfo(seriesId: string): Promise<SeriesInfo> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getSeriesInfo(seriesId)
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch series info',
          'xtream',
          error
        )
      }
    }

    throw new SourceNormalizerError('M3U sources do not support series', 'm3u')
  }

  /**
   * Gets EPG (Electronic Program Guide) data
   *
   * @param streamId - Optional stream ID to get EPG for specific channel
   *
   * Note: For M3U sources, EPG must be fetched separately using the EPG URL
   */
  async getEPG(streamId?: string): Promise<EPGData> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }
      try {
        return await this.xtreamClient.getEPG(streamId)
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch EPG',
          'xtream',
          error
        )
      }
    }

    // M3U sources require external EPG fetching
    // Return empty EPG data - external EPG parsing should be used
    return {
      programs: {},
      lastUpdated: Date.now(),
      source: 'm3u',
    }
  }

  /**
   * Gets the EPG URL for the source
   *
   * For Xtream: Returns undefined (EPG is fetched via API)
   * For M3U: Returns the EPG URL from playlist header or source config
   */
  async getEPGUrl(): Promise<string | undefined> {
    if (isM3USource(this.source)) {
      const data = await this.getM3UData()
      return data.epgUrl || (this.source as M3USource).epgUrl
    }

    // Xtream sources use API for EPG
    return undefined
  }

  /**
   * Fetches all content from the source in one call
   *
   * Useful for initial loading or full refresh
   */
  async getAllContent(): Promise<NormalizedContent> {
    if (isXtreamSource(this.source)) {
      if (!this.xtreamClient) {
        throw new SourceNormalizerError('Xtream client not initialized', 'xtream')
      }

      try {
        // Fetch all content types in parallel
        const [
          liveCategories,
          liveChannels,
          vodCategories,
          vodItems,
          seriesCategories,
          series,
        ] = await Promise.all([
          this.xtreamClient.getLiveCategories(),
          this.xtreamClient.getLiveStreams(),
          this.xtreamClient.getVODCategories(),
          this.xtreamClient.getVODStreams(),
          this.xtreamClient.getSeriesCategories(),
          this.xtreamClient.getSeries(),
        ])

        return {
          liveCategories,
          liveChannels,
          vodCategories,
          vodItems,
          seriesCategories,
          series,
        }
      } catch (error) {
        throw new SourceNormalizerError(
          error instanceof Error ? error.message : 'Failed to fetch content',
          'xtream',
          error
        )
      }
    }

    // M3U source
    const data = await this.getM3UData()

    return {
      liveCategories: data.categories,
      liveChannels: data.channels,
      vodCategories: [],
      vodItems: [],
      seriesCategories: [],
      series: [],
      epgUrl: data.epgUrl,
    }
  }

  /**
   * Checks if the source supports VOD content
   */
  supportsVOD(): boolean {
    return isXtreamSource(this.source)
  }

  /**
   * Checks if the source supports series content
   */
  supportsSeries(): boolean {
    return isXtreamSource(this.source)
  }

  /**
   * Checks if the source has integrated EPG (via API)
   */
  hasIntegratedEPG(): boolean {
    return isXtreamSource(this.source)
  }

  /**
   * Clears any cached data
   */
  clearCache(): void {
    this.m3uCache = null
    this.m3uCacheTime = 0
  }
}

/**
 * Creates a SourceNormalizer for a given source
 *
 * @param source - The source configuration
 * @returns A new SourceNormalizer instance
 */
export function createSourceNormalizer(source: Source): SourceNormalizer {
  return new SourceNormalizer(source)
}
