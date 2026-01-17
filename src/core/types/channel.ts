/**
 * Channel, Category, and Program types for live TV
 */

/**
 * Represents a live TV channel category
 */
export interface Category {
  /** Unique identifier for the category */
  id: string
  /** Display name of the category */
  name: string
  /** Parent category ID for nested categories (optional) */
  parentId?: string
}

/**
 * Represents a live TV channel
 */
export interface Channel {
  /** Unique identifier for the channel */
  id: string
  /** Display name of the channel */
  name: string
  /** Channel number for display/sorting */
  number?: number
  /** URL to channel logo image */
  logo?: string
  /** Category ID this channel belongs to */
  categoryId: string
  /** Stream URL for playback */
  streamUrl: string
  /** Stream type (e.g., 'live', 'hls', 'dash') */
  streamType?: 'live' | 'hls' | 'dash' | 'unknown'
  /** EPG channel ID for program guide linking */
  epgChannelId?: string
  /** Whether the channel is currently available */
  isAvailable?: boolean
}

/**
 * Represents a TV program in the EPG
 */
export interface Program {
  /** Unique identifier for the program */
  id: string
  /** Channel ID this program airs on */
  channelId: string
  /** Program title */
  title: string
  /** Program description */
  description?: string
  /** Start time as ISO 8601 string or Unix timestamp */
  startTime: string | number
  /** End time as ISO 8601 string or Unix timestamp */
  endTime: string | number
  /** Program category/genre */
  category?: string
  /** URL to program poster/thumbnail image */
  image?: string
  /** Episode number if part of a series */
  episodeNumber?: number
  /** Season number if part of a series */
  seasonNumber?: number
  /** Content rating (e.g., 'TV-14', 'PG') */
  rating?: string
}

/**
 * EPG data organized by channel
 */
export interface EPGData {
  /** Map of channel ID to array of programs */
  programs: Record<string, Program[]>
  /** When this EPG data was last updated */
  lastUpdated: string | number
  /** Source URL or identifier for the EPG data */
  source?: string
}
