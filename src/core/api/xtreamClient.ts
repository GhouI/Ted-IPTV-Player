/**
 * Xtream Codes API client with authentication
 *
 * Implements the Xtream Codes API for fetching live TV, VOD, and series content.
 * @see https://github.com/tellytv/go.xtream-codes/wiki/XtreamCodes-API
 */

import type {
  XtreamSource,
  XtreamAuthResponse,
  XtreamUserInfo,
  XtreamServerInfo,
} from '../types/source'
import type { Category, Channel } from '../types/channel'
import type { VODCategory, VODItem, Series, Season, Episode, SeriesInfo } from '../types/vod'

/**
 * Error thrown when Xtream API requests fail
 */
export class XtreamApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message)
    this.name = 'XtreamApiError'
  }
}

/**
 * Raw authentication response from Xtream API
 */
interface RawAuthResponse {
  user_info: {
    username: string
    password: string
    message?: string
    auth: number
    status: string
    exp_date: string | number | null
    is_trial: string | number
    active_cons: string | number
    created_at: string | number
    max_connections: string | number
    allowed_output_formats: string[]
  }
  server_info: {
    url: string
    port: string
    https_port?: string
    server_protocol: string
    rtmp_port?: string
    timezone: string
    timestamp_now: number
    time_format?: string
  }
}

/**
 * Raw category response from Xtream API
 */
interface RawCategory {
  category_id: string
  category_name: string
  parent_id?: number | string
}

/**
 * Raw live stream response from Xtream API
 */
interface RawLiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string | null
  added: string
  is_adult: string | number
  category_id: string
  category_ids?: number[]
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

/**
 * Raw VOD stream response from Xtream API
 */
interface RawVODStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  rating: string
  rating_5based: number
  added: string
  is_adult: string | number
  category_id: string
  category_ids?: number[]
  container_extension: string
  custom_sid: string
  direct_source: string
}

/**
 * Raw series response from Xtream API
 */
interface RawSeries {
  num: number
  name: string
  series_id: number
  cover: string
  plot: string
  cast: string
  director: string
  genre: string
  releaseDate: string
  last_modified: string
  rating: string
  rating_5based: number
  backdrop_path?: string[]
  youtube_trailer?: string
  episode_run_time?: string
  category_id: string
  category_ids?: number[]
}

/**
 * Raw series info response from Xtream API
 */
interface RawSeriesInfo {
  seasons: RawSeriesInfoSeason[]
  info: {
    name: string
    cover: string
    plot: string
    cast: string
    director: string
    genre: string
    releaseDate: string
    last_modified: string
    rating: string
    rating_5based: number
    backdrop_path?: string[]
    youtube_trailer?: string
    episode_run_time?: string
    category_id: string
  }
  episodes: Record<string, RawSeriesEpisode[]>
}

/**
 * Raw season info from series info response
 */
interface RawSeriesInfoSeason {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  season_number: number
  cover?: string
  cover_big?: string
}

/**
 * Raw episode from series info response
 */
interface RawSeriesEpisode {
  id: string
  episode_num: number
  title: string
  container_extension: string
  info: {
    movie_image?: string
    plot?: string
    releasedate?: string
    rating?: string
    duration_secs?: number
    duration?: string
    video?: {
      codec_name?: string
    }
    audio?: {
      codec_name?: string
    }
  }
  custom_sid: string
  added: string
  season: number
  direct_source: string
}

/**
 * Normalizes the raw Xtream auth response to our typed format
 */
function normalizeAuthResponse(raw: RawAuthResponse): XtreamAuthResponse {
  const userInfo: XtreamUserInfo = {
    username: raw.user_info.username,
    status: raw.user_info.status,
    expDate: raw.user_info.exp_date,
    isTrial: raw.user_info.is_trial === '1' || raw.user_info.is_trial === 1,
    activeCons:
      typeof raw.user_info.active_cons === 'string'
        ? parseInt(raw.user_info.active_cons, 10)
        : raw.user_info.active_cons,
    createdAt: raw.user_info.created_at,
    maxConnections:
      typeof raw.user_info.max_connections === 'string'
        ? parseInt(raw.user_info.max_connections, 10)
        : raw.user_info.max_connections,
    allowedOutputFormats: raw.user_info.allowed_output_formats || [],
  }

  const serverInfo: XtreamServerInfo = {
    url: raw.server_info.url,
    port: raw.server_info.port,
    httpsPort: raw.server_info.https_port,
    serverProtocol: raw.server_info.server_protocol as 'http' | 'https',
    rtmpPort: raw.server_info.rtmp_port,
    timezone: raw.server_info.timezone,
    timestampNow: raw.server_info.timestamp_now,
    timeFormat: raw.server_info.time_format,
  }

  return { userInfo, serverInfo }
}

/**
 * Normalizes a raw Xtream category to our Category type
 */
function normalizeLiveCategory(raw: RawCategory): Category {
  return {
    id: raw.category_id,
    name: raw.category_name,
    parentId: raw.parent_id !== undefined ? String(raw.parent_id) : undefined,
  }
}

/**
 * Normalizes a raw Xtream live stream to our Channel type
 */
function normalizeLiveStream(
  raw: RawLiveStream,
  baseUrl: string,
  username: string,
  password: string
): Channel {
  const streamId = raw.stream_id
  const streamUrl = `${baseUrl}/live/${username}/${password}/${streamId}.ts`

  return {
    id: String(streamId),
    name: raw.name,
    number: raw.num,
    logo: raw.stream_icon || undefined,
    categoryId: raw.category_id,
    streamUrl,
    streamType: 'live',
    epgChannelId: raw.epg_channel_id || undefined,
    isAvailable: true,
  }
}

/**
 * Normalizes a raw Xtream category to our VODCategory type
 */
function normalizeVODCategory(raw: RawCategory): VODCategory {
  return {
    id: raw.category_id,
    name: raw.category_name,
    parentId: raw.parent_id !== undefined ? String(raw.parent_id) : undefined,
  }
}

/**
 * Normalizes a raw Xtream VOD stream to our VODItem type
 */
function normalizeVODStream(
  raw: RawVODStream,
  baseUrl: string,
  username: string,
  password: string
): VODItem {
  const streamId = raw.stream_id
  const extension = raw.container_extension || 'm3u8'
  const streamUrl = `${baseUrl}/movie/${username}/${password}/${streamId}.${extension}`

  return {
    id: String(streamId),
    title: raw.name,
    categoryId: raw.category_id,
    streamUrl,
    streamType: 'vod',
    poster: raw.stream_icon || undefined,
    rating: raw.rating || undefined,
    score: raw.rating_5based > 0 ? raw.rating_5based : undefined,
    containerFormat: raw.container_extension || undefined,
    dateAdded: raw.added || undefined,
  }
}

/**
 * Normalizes a raw Xtream category to our VODCategory type (for series)
 */
function normalizeSeriesCategory(raw: RawCategory): VODCategory {
  return {
    id: raw.category_id,
    name: raw.category_name,
    parentId: raw.parent_id !== undefined ? String(raw.parent_id) : undefined,
  }
}

/**
 * Normalizes a raw Xtream series to our Series type
 */
function normalizeSeries(raw: RawSeries): Series {
  const genres = raw.genre
    ? raw.genre.split(',').map((g) => g.trim()).filter(Boolean)
    : undefined
  const cast = raw.cast
    ? raw.cast.split(',').map((c) => c.trim()).filter(Boolean)
    : undefined

  // Extract year from releaseDate if available
  let year: number | undefined
  if (raw.releaseDate) {
    const match = raw.releaseDate.match(/\d{4}/)
    if (match) {
      year = parseInt(match[0], 10)
    }
  }

  return {
    id: String(raw.series_id),
    title: raw.name,
    description: raw.plot || undefined,
    categoryId: raw.category_id,
    poster: raw.cover || undefined,
    backdrop: raw.backdrop_path?.[0] || undefined,
    year,
    genres: genres && genres.length > 0 ? genres : undefined,
    cast: cast && cast.length > 0 ? cast : undefined,
    rating: raw.rating || undefined,
    score: raw.rating_5based > 0 ? raw.rating_5based : undefined,
    lastUpdated: raw.last_modified || undefined,
  }
}

/**
 * Normalizes raw series info response to our SeriesInfo type
 */
function normalizeSeriesInfo(
  raw: RawSeriesInfo,
  seriesId: string,
  baseUrl: string,
  username: string,
  password: string
): SeriesInfo {
  const genres = raw.info.genre
    ? raw.info.genre.split(',').map((g) => g.trim()).filter(Boolean)
    : undefined
  const cast = raw.info.cast
    ? raw.info.cast.split(',').map((c) => c.trim()).filter(Boolean)
    : undefined

  // Extract year from releaseDate if available
  let year: number | undefined
  if (raw.info.releaseDate) {
    const match = raw.info.releaseDate.match(/\d{4}/)
    if (match) {
      year = parseInt(match[0], 10)
    }
  }

  // Calculate total episodes
  let episodeCount = 0
  for (const seasonEpisodes of Object.values(raw.episodes || {})) {
    episodeCount += seasonEpisodes.length
  }

  const series: Series = {
    id: seriesId,
    title: raw.info.name,
    description: raw.info.plot || undefined,
    categoryId: raw.info.category_id,
    poster: raw.info.cover || undefined,
    backdrop: raw.info.backdrop_path?.[0] || undefined,
    year,
    genres: genres && genres.length > 0 ? genres : undefined,
    cast: cast && cast.length > 0 ? cast : undefined,
    rating: raw.info.rating || undefined,
    score: raw.info.rating_5based > 0 ? raw.info.rating_5based : undefined,
    seasonCount: raw.seasons?.length || 0,
    episodeCount,
    lastUpdated: raw.info.last_modified || undefined,
  }

  // Normalize seasons
  const seasons: Season[] = (raw.seasons || []).map((rawSeason) => ({
    id: String(rawSeason.id),
    seriesId,
    seasonNumber: rawSeason.season_number,
    name: rawSeason.name || `Season ${rawSeason.season_number}`,
    description: rawSeason.overview || undefined,
    poster: rawSeason.cover_big || rawSeason.cover || undefined,
    airDate: rawSeason.air_date || undefined,
    episodeCount: rawSeason.episode_count,
  }))

  // Normalize episodes
  const episodes: Record<string, Episode[]> = {}
  for (const [seasonNum, rawEpisodes] of Object.entries(raw.episodes || {})) {
    const season = seasons.find((s) => s.seasonNumber === parseInt(seasonNum, 10))
    const seasonId = season?.id || seasonNum

    episodes[seasonId] = (rawEpisodes || []).map((rawEp) => {
      const extension = rawEp.container_extension || 'm3u8'
      const streamUrl = `${baseUrl}/series/${username}/${password}/${rawEp.id}.${extension}`

      return {
        id: rawEp.id,
        seriesId,
        seasonId,
        seasonNumber: rawEp.season,
        episodeNumber: rawEp.episode_num,
        title: rawEp.title || `Episode ${rawEp.episode_num}`,
        description: rawEp.info?.plot || undefined,
        streamUrl,
        streamType: 'vod' as const,
        thumbnail: rawEp.info?.movie_image || undefined,
        duration: rawEp.info?.duration_secs || undefined,
        airDate: rawEp.info?.releasedate || undefined,
        rating: rawEp.info?.rating || undefined,
        containerFormat: rawEp.container_extension || undefined,
        videoCodec: rawEp.info?.video?.codec_name || undefined,
        audioCodec: rawEp.info?.audio?.codec_name || undefined,
      }
    })
  }

  return { series, seasons, episodes }
}

/**
 * Configuration for creating an Xtream client
 */
export interface XtreamClientConfig {
  /** Server URL (e.g., 'http://example.com:8080') */
  serverUrl: string
  /** Username for authentication */
  username: string
  /** Password for authentication */
  password: string
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Xtream Codes API client
 *
 * Provides methods to authenticate and fetch content from an Xtream Codes server.
 */
export class XtreamClient {
  private readonly baseUrl: string
  private readonly username: string
  private readonly password: string
  private readonly timeout: number
  private authResponse: XtreamAuthResponse | null = null

  constructor(config: XtreamClientConfig) {
    // Normalize the server URL (remove trailing slash)
    this.baseUrl = config.serverUrl.replace(/\/+$/, '')
    this.username = config.username
    this.password = config.password
    this.timeout = config.timeout ?? 30000
  }

  /**
   * Creates an XtreamClient from an XtreamSource
   */
  static fromSource(source: XtreamSource): XtreamClient {
    return new XtreamClient({
      serverUrl: source.serverUrl,
      username: source.username,
      password: source.password,
    })
  }

  /**
   * Builds a URL for the player API endpoint
   */
  private buildApiUrl(action?: string): string {
    const url = new URL(`${this.baseUrl}/player_api.php`)
    url.searchParams.set('username', this.username)
    url.searchParams.set('password', this.password)
    if (action) {
      url.searchParams.set('action', action)
    }
    return url.toString()
  }

  /**
   * Makes an authenticated API request
   */
  private async request<T>(action?: string, params?: Record<string, string>): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const url = new URL(this.buildApiUrl(action))
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value)
        }
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new XtreamApiError(
          `HTTP error ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()

      // Check for authentication failure in response
      if (data?.user_info?.auth === 0) {
        throw new XtreamApiError('Authentication failed: Invalid credentials')
      }

      return data as T
    } catch (error) {
      if (error instanceof XtreamApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new XtreamApiError(`Request timeout after ${this.timeout}ms`)
        }
        throw new XtreamApiError(`Request failed: ${error.message}`)
      }

      throw new XtreamApiError('An unknown error occurred')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Authenticates with the Xtream server and returns user/server info
   *
   * This is the primary method to validate credentials and get account details.
   * The response includes subscription status, expiration date, and server capabilities.
   *
   * @returns Authentication response with user and server info
   * @throws XtreamApiError if authentication fails
   */
  async authenticate(): Promise<XtreamAuthResponse> {
    const rawResponse = await this.request<RawAuthResponse>()
    this.authResponse = normalizeAuthResponse(rawResponse)
    return this.authResponse
  }

  /**
   * Returns the cached authentication response if available
   */
  getAuthResponse(): XtreamAuthResponse | null {
    return this.authResponse
  }

  /**
   * Checks if the user account is currently active
   */
  isAccountActive(): boolean {
    if (!this.authResponse) {
      return false
    }

    const { status, expDate } = this.authResponse.userInfo

    // Check status
    if (status.toLowerCase() !== 'active') {
      return false
    }

    // Check expiration
    if (expDate !== null) {
      const expTimestamp =
        typeof expDate === 'string' ? parseInt(expDate, 10) : expDate
      const now = Math.floor(Date.now() / 1000)
      if (expTimestamp <= now) {
        return false
      }
    }

    return true
  }

  /**
   * Gets the account expiration date as a Date object
   * Returns null if the account doesn't expire or if not authenticated
   */
  getExpirationDate(): Date | null {
    if (!this.authResponse?.userInfo.expDate) {
      return null
    }

    const expDate = this.authResponse.userInfo.expDate
    const timestamp = typeof expDate === 'string' ? parseInt(expDate, 10) : expDate

    if (isNaN(timestamp) || timestamp <= 0) {
      return null
    }

    return new Date(timestamp * 1000)
  }

  /**
   * Returns the server base URL
   */
  getServerUrl(): string {
    return this.baseUrl
  }

  /**
   * Builds a stream URL for a given stream ID and type
   *
   * @param streamId - The ID of the stream
   * @param type - The type of stream ('live', 'movie', 'series')
   * @param format - The stream format (default: 'ts' for live, 'm3u8' for VOD)
   */
  buildStreamUrl(
    streamId: string | number,
    type: 'live' | 'movie' | 'series',
    format?: string
  ): string {
    const defaultFormat = type === 'live' ? 'ts' : 'm3u8'
    const ext = format ?? defaultFormat
    return `${this.baseUrl}/${type}/${this.username}/${this.password}/${streamId}.${ext}`
  }

  /**
   * Fetches all live TV categories
   *
   * @returns Array of categories for live streams
   * @throws XtreamApiError if the request fails
   */
  async getLiveCategories(): Promise<Category[]> {
    const rawCategories = await this.request<RawCategory[]>('get_live_categories')
    return rawCategories.map(normalizeLiveCategory)
  }

  /**
   * Fetches all live TV streams/channels
   *
   * @param categoryId - Optional category ID to filter streams
   * @returns Array of channels
   * @throws XtreamApiError if the request fails
   */
  async getLiveStreams(categoryId?: string): Promise<Channel[]> {
    const params: Record<string, string> = {}
    if (categoryId) {
      params.category_id = categoryId
    }

    const rawStreams = await this.request<RawLiveStream[]>('get_live_streams', params)
    return rawStreams.map((stream) => normalizeLiveStream(stream, this.baseUrl, this.username, this.password))
  }

  /**
   * Fetches live streams for a specific category
   *
   * @param categoryId - The category ID to fetch streams for
   * @returns Array of channels in the category
   * @throws XtreamApiError if the request fails
   */
  async getLiveStreamsByCategory(categoryId: string): Promise<Channel[]> {
    return this.getLiveStreams(categoryId)
  }

  /**
   * Fetches all VOD (movie) categories
   *
   * @returns Array of VOD categories
   * @throws XtreamApiError if the request fails
   */
  async getVODCategories(): Promise<VODCategory[]> {
    const rawCategories = await this.request<RawCategory[]>('get_vod_categories')
    return rawCategories.map(normalizeVODCategory)
  }

  /**
   * Fetches all VOD streams/movies
   *
   * @param categoryId - Optional category ID to filter streams
   * @returns Array of VOD items
   * @throws XtreamApiError if the request fails
   */
  async getVODStreams(categoryId?: string): Promise<VODItem[]> {
    const params: Record<string, string> = {}
    if (categoryId) {
      params.category_id = categoryId
    }

    const rawStreams = await this.request<RawVODStream[]>('get_vod_streams', params)
    return rawStreams.map((stream) =>
      normalizeVODStream(stream, this.baseUrl, this.username, this.password)
    )
  }

  /**
   * Fetches VOD streams for a specific category
   *
   * @param categoryId - The category ID to fetch streams for
   * @returns Array of VOD items in the category
   * @throws XtreamApiError if the request fails
   */
  async getVODStreamsByCategory(categoryId: string): Promise<VODItem[]> {
    return this.getVODStreams(categoryId)
  }

  /**
   * Fetches all series categories
   *
   * @returns Array of series categories
   * @throws XtreamApiError if the request fails
   */
  async getSeriesCategories(): Promise<VODCategory[]> {
    const rawCategories = await this.request<RawCategory[]>('get_series_categories')
    return rawCategories.map(normalizeSeriesCategory)
  }

  /**
   * Fetches all series
   *
   * @param categoryId - Optional category ID to filter series
   * @returns Array of series
   * @throws XtreamApiError if the request fails
   */
  async getSeries(categoryId?: string): Promise<Series[]> {
    const params: Record<string, string> = {}
    if (categoryId) {
      params.category_id = categoryId
    }

    const rawSeries = await this.request<RawSeries[]>('get_series', params)
    return rawSeries.map(normalizeSeries)
  }

  /**
   * Fetches series for a specific category
   *
   * @param categoryId - The category ID to fetch series for
   * @returns Array of series in the category
   * @throws XtreamApiError if the request fails
   */
  async getSeriesByCategory(categoryId: string): Promise<Series[]> {
    return this.getSeries(categoryId)
  }

  /**
   * Fetches detailed information about a series including seasons and episodes
   *
   * @param seriesId - The series ID to fetch info for
   * @returns Series info including seasons and episodes
   * @throws XtreamApiError if the request fails
   */
  async getSeriesInfo(seriesId: string): Promise<SeriesInfo> {
    const rawInfo = await this.request<RawSeriesInfo>('get_series_info', {
      series_id: seriesId,
    })
    return normalizeSeriesInfo(rawInfo, seriesId, this.baseUrl, this.username, this.password)
  }
}

/**
 * Creates an Xtream client and authenticates in one step
 *
 * @param config - Client configuration
 * @returns Authenticated client
 * @throws XtreamApiError if authentication fails
 */
export async function createAuthenticatedClient(
  config: XtreamClientConfig
): Promise<XtreamClient> {
  const client = new XtreamClient(config)
  await client.authenticate()
  return client
}
