/**
 * IPTV Source types (Xtream Codes and M3U)
 */

/**
 * Base source type discriminator
 */
export type SourceType = 'xtream' | 'm3u'

/**
 * Base interface for all IPTV sources
 */
export interface BaseSource {
  /** Unique identifier for the source */
  id: string
  /** User-defined name for the source */
  name: string
  /** Type of source (xtream or m3u) */
  type: SourceType
  /** Whether this is the currently active source */
  isActive?: boolean
  /** When this source was added */
  createdAt: string | number
  /** When this source was last used */
  lastUsedAt?: string | number
}

/**
 * Xtream Codes API source configuration
 */
export interface XtreamSource extends BaseSource {
  type: 'xtream'
  /** Server URL (e.g., 'http://example.com:8080') */
  serverUrl: string
  /** Username for authentication */
  username: string
  /** Password for authentication */
  password: string
}

/**
 * M3U playlist source configuration
 */
export interface M3USource extends BaseSource {
  type: 'm3u'
  /** URL to the M3U playlist file */
  playlistUrl: string
  /** Optional EPG/XMLTV URL for program guide data */
  epgUrl?: string
}

/**
 * Union type for all source types
 */
export type Source = XtreamSource | M3USource

/**
 * Xtream Codes server information returned from authentication
 */
export interface XtreamServerInfo {
  /** Server URL */
  url: string
  /** Server port */
  port: string
  /** HTTPS port (if available) */
  httpsPort?: string
  /** Server protocol */
  serverProtocol: 'http' | 'https'
  /** Real-time messaging protocol URL */
  rtmpPort?: string
  /** Timezone of the server */
  timezone: string
  /** Timestamp offset from server */
  timestampNow: number
  /** Time format used by server */
  timeFormat?: string
}

/**
 * Xtream Codes user information returned from authentication
 */
export interface XtreamUserInfo {
  /** Username */
  username: string
  /** User status (Active, Expired, etc.) */
  status: string
  /** Expiration date as Unix timestamp */
  expDate: string | number | null
  /** Whether the user is a trial user */
  isTrial: boolean
  /** Number of active connections */
  activeCons: number
  /** Date the account was created */
  createdAt: string | number
  /** Maximum allowed connections */
  maxConnections: number
  /** Allowed output formats */
  allowedOutputFormats: string[]
}

/**
 * Xtream Codes authentication response
 */
export interface XtreamAuthResponse {
  /** User information */
  userInfo: XtreamUserInfo
  /** Server information */
  serverInfo: XtreamServerInfo
}

/**
 * Source validation result
 */
export interface SourceValidationResult {
  /** Whether the source is valid and accessible */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Authentication response for Xtream sources */
  authResponse?: XtreamAuthResponse
  /** Number of channels found (for validation feedback) */
  channelCount?: number
  /** Number of VOD items found */
  vodCount?: number
  /** Number of series found */
  seriesCount?: number
}

/**
 * Input for creating a new Xtream source (before ID and timestamps)
 */
export interface XtreamSourceInput {
  name: string
  serverUrl: string
  username: string
  password: string
}

/**
 * Input for creating a new M3U source (before ID and timestamps)
 */
export interface M3USourceInput {
  name: string
  playlistUrl: string
  epgUrl?: string
}

/**
 * Union type for source creation inputs
 */
export type SourceInput =
  | (XtreamSourceInput & { type: 'xtream' })
  | (M3USourceInput & { type: 'm3u' })

/**
 * Type guard to check if a source is an Xtream source
 */
export function isXtreamSource(source: Source): source is XtreamSource {
  return source.type === 'xtream'
}

/**
 * Type guard to check if a source is an M3U source
 */
export function isM3USource(source: Source): source is M3USource {
  return source.type === 'm3u'
}
