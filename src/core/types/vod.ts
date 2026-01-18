/**
 * VOD (Video on Demand), Series, and Episode types
 */

/**
 * Represents a VOD category
 */
export interface VODCategory {
  /** Unique identifier for the category */
  id: string
  /** Display name of the category */
  name: string
  /** Parent category ID for nested categories (optional) */
  parentId?: string
}

/**
 * Represents a VOD movie/video
 */
export interface VODItem {
  /** Unique identifier for the VOD item */
  id: string
  /** Movie/video title */
  title: string
  /** Plot description or synopsis */
  description?: string
  /** Category ID this VOD belongs to */
  categoryId: string
  /** Stream URL for playback */
  streamUrl: string
  /** Stream type (e.g., 'vod', 'hls', 'dash') */
  streamType?: 'vod' | 'hls' | 'dash' | 'unknown'
  /** URL to movie poster image */
  poster?: string
  /** URL to backdrop/banner image */
  backdrop?: string
  /** Release year */
  year?: number
  /** Duration in seconds */
  duration?: number
  /** Genre(s) */
  genres?: string[]
  /** Director name(s) */
  directors?: string[]
  /** Cast member names */
  cast?: string[]
  /** Content rating (e.g., 'R', 'PG-13') */
  rating?: string
  /** User rating score (e.g., IMDB rating) */
  score?: number
  /** Container format (e.g., 'mkv', 'mp4') */
  containerFormat?: string
  /** Video codec (e.g., 'h264', 'hevc') */
  videoCodec?: string
  /** Audio codec (e.g., 'aac', 'ac3') */
  audioCodec?: string
  /** Date added to the service */
  dateAdded?: string | number
}

/**
 * Represents a TV series
 */
export interface Series {
  /** Unique identifier for the series */
  id: string
  /** Series title */
  title: string
  /** Series description/plot */
  description?: string
  /** Category ID this series belongs to */
  categoryId: string
  /** URL to series poster image */
  poster?: string
  /** URL to backdrop/banner image */
  backdrop?: string
  /** First air year */
  year?: number
  /** Genre(s) */
  genres?: string[]
  /** Cast member names */
  cast?: string[]
  /** Content rating */
  rating?: string
  /** User rating score */
  score?: number
  /** Total number of seasons */
  seasonCount?: number
  /** Total number of episodes across all seasons */
  episodeCount?: number
  /** Date last updated */
  lastUpdated?: string | number
}

/**
 * Represents a season within a series
 */
export interface Season {
  /** Unique identifier for the season */
  id: string
  /** Series ID this season belongs to */
  seriesId: string
  /** Season number (1-indexed) */
  seasonNumber: number
  /** Season name/title (e.g., "Season 1" or custom name) */
  name?: string
  /** Season description/overview */
  description?: string
  /** URL to season poster image */
  poster?: string
  /** Air date of first episode */
  airDate?: string | number
  /** Number of episodes in this season */
  episodeCount?: number
}

/**
 * Represents an episode within a series
 */
export interface Episode {
  /** Unique identifier for the episode */
  id: string
  /** Series ID this episode belongs to */
  seriesId: string
  /** Season ID this episode belongs to */
  seasonId: string
  /** Season number */
  seasonNumber: number
  /** Episode number within the season */
  episodeNumber: number
  /** Episode title */
  title: string
  /** Episode description/plot */
  description?: string
  /** Stream URL for playback */
  streamUrl: string
  /** Stream type */
  streamType?: 'vod' | 'hls' | 'dash' | 'unknown'
  /** URL to episode thumbnail/still image */
  thumbnail?: string
  /** Duration in seconds */
  duration?: number
  /** Air date */
  airDate?: string | number
  /** Content rating */
  rating?: string
  /** Container format */
  containerFormat?: string
  /** Video codec */
  videoCodec?: string
  /** Audio codec */
  audioCodec?: string
}

/**
 * Series info with all seasons and episodes
 */
export interface SeriesInfo {
  /** The series metadata */
  series: Series
  /** Array of seasons in the series */
  seasons: Season[]
  /** Map of season ID to array of episodes */
  episodes: Record<string, Episode[]>
}
