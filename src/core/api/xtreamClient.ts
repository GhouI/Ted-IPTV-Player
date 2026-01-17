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
