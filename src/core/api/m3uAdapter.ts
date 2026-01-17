/**
 * M3U Adapter
 *
 * Converts parsed M3U playlist data into normalized Channel and Category types
 * that can be used consistently throughout the application.
 */

import type { M3UItem, M3UPlaylist } from './m3uParser'
import { extractGroups } from './m3uParser'
import type { Category, Channel } from '../types/channel'

/**
 * Options for the M3U adapter
 */
export interface M3UAdapterOptions {
  /** Base URL for the source (used for generating IDs) */
  sourceId?: string
  /** Default category name for ungrouped channels */
  defaultCategoryName?: string
  /** Category ID for ungrouped channels */
  defaultCategoryId?: string
}

const DEFAULT_OPTIONS: Required<M3UAdapterOptions> = {
  sourceId: 'm3u',
  defaultCategoryName: 'Uncategorized',
  defaultCategoryId: 'uncategorized',
}

/**
 * Generates a consistent category ID from a category name
 *
 * @param name - The category name
 * @param sourceId - The source identifier for prefixing
 * @returns A sanitized category ID
 */
export function generateCategoryId(name: string, sourceId: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${sourceId}-cat-${sanitized || 'unknown'}`
}

/**
 * Generates a consistent channel ID from an M3U item
 *
 * @param item - The M3U item
 * @param index - The index in the playlist
 * @param sourceId - The source identifier for prefixing
 * @returns A unique channel ID
 */
export function generateChannelId(item: M3UItem, index: number, sourceId: string): string {
  // Prefer tvgId if available, otherwise use index
  if (item.tvgId) {
    const sanitized = item.tvgId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${sourceId}-ch-${sanitized}`
  }
  return `${sourceId}-ch-${index}`
}

/**
 * Detects the stream type from a URL
 *
 * @param url - The stream URL
 * @returns The detected stream type
 */
export function detectStreamType(url: string): Channel['streamType'] {
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
    return 'hls'
  }
  if (lowerUrl.includes('.mpd') || lowerUrl.includes('/dash/')) {
    return 'dash'
  }
  if (
    lowerUrl.includes('/live/') ||
    lowerUrl.includes('live.') ||
    lowerUrl.endsWith('.ts')
  ) {
    return 'live'
  }

  return 'unknown'
}

/**
 * Extracts categories from an M3U playlist
 *
 * @param playlist - The parsed M3U playlist
 * @param options - Adapter options
 * @returns Array of Category objects
 */
export function extractCategories(
  playlist: M3UPlaylist,
  options: M3UAdapterOptions = {}
): Category[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const groupNames = extractGroups(playlist)
  const categories: Category[] = []

  // Add categories from playlist groups
  for (const name of groupNames) {
    categories.push({
      id: generateCategoryId(name, opts.sourceId),
      name,
    })
  }

  // Check if there are any ungrouped items
  const hasUngrouped = playlist.items.some((item) => !item.group)
  if (hasUngrouped) {
    categories.push({
      id: generateCategoryId(opts.defaultCategoryId, opts.sourceId),
      name: opts.defaultCategoryName,
    })
  }

  return categories
}

/**
 * Extracts channels from an M3U playlist
 *
 * @param playlist - The parsed M3U playlist
 * @param options - Adapter options
 * @returns Array of Channel objects
 */
export function extractChannels(
  playlist: M3UPlaylist,
  options: M3UAdapterOptions = {}
): Channel[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const channels: Channel[] = []

  for (let i = 0; i < playlist.items.length; i++) {
    const item = playlist.items[i]
    const categoryId = generateCategoryId(
      item.group || opts.defaultCategoryId,
      opts.sourceId
    )

    channels.push({
      id: generateChannelId(item, i, opts.sourceId),
      name: item.name,
      number: i + 1,
      logo: item.tvgLogo,
      categoryId,
      streamUrl: item.url,
      streamType: detectStreamType(item.url),
      epgChannelId: item.tvgId || item.tvgName,
      isAvailable: true,
    })
  }

  return channels
}

/**
 * Result of adapting an M3U playlist
 */
export interface M3UAdapterResult {
  /** Extracted categories */
  categories: Category[]
  /** Extracted channels */
  channels: Channel[]
  /** EPG URL from the playlist header (if available) */
  epgUrl?: string
}

/**
 * Adapts a complete M3U playlist to normalized data structures
 *
 * @param playlist - The parsed M3U playlist
 * @param options - Adapter options
 * @returns Object containing categories, channels, and EPG URL
 *
 * @example
 * ```typescript
 * const playlist = parseM3U(m3uContent)
 * const { categories, channels, epgUrl } = adaptM3UPlaylist(playlist, {
 *   sourceId: 'my-source'
 * })
 * ```
 */
export function adaptM3UPlaylist(
  playlist: M3UPlaylist,
  options: M3UAdapterOptions = {}
): M3UAdapterResult {
  return {
    categories: extractCategories(playlist, options),
    channels: extractChannels(playlist, options),
    epgUrl: playlist.header.epgUrl,
  }
}

/**
 * Gets channels by category ID
 *
 * @param channels - Array of channels
 * @param categoryId - Category ID to filter by
 * @returns Filtered array of channels
 */
export function getChannelsByCategory(channels: Channel[], categoryId: string): Channel[] {
  return channels.filter((channel) => channel.categoryId === categoryId)
}

/**
 * Finds a channel by its EPG channel ID
 *
 * @param channels - Array of channels
 * @param epgChannelId - EPG channel ID to search for
 * @returns The matching channel or undefined
 */
export function findChannelByEpgId(
  channels: Channel[],
  epgChannelId: string
): Channel | undefined {
  return channels.find((channel) => channel.epgChannelId === epgChannelId)
}

/**
 * Gets the total count of channels per category
 *
 * @param channels - Array of channels
 * @returns Map of category ID to channel count
 */
export function getChannelCountByCategory(channels: Channel[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const channel of channels) {
    counts[channel.categoryId] = (counts[channel.categoryId] || 0) + 1
  }
  return counts
}
