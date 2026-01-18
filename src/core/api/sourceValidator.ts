/**
 * Source Validator
 *
 * Validates IPTV source connections before they are saved.
 * Tests connectivity for both Xtream Codes and M3U playlist sources.
 */

import type {
  XtreamSourceInput,
  M3USourceInput,
  SourceType,
  XtreamAuthResponse,
} from '../types/source'
import { XtreamClient, XtreamApiError } from './xtreamClient'
import { fetchAndParseM3U, M3UParseError } from './m3uParser'
import { adaptM3UPlaylist } from './m3uAdapter'

/**
 * Result of validating an Xtream source
 */
export interface XtreamValidationResult {
  /** Whether the source is valid and accessible */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Authentication response if successful */
  authResponse?: XtreamAuthResponse
  /** Number of live channels found */
  channelCount?: number
  /** Number of VOD items found */
  vodCount?: number
  /** Number of series found */
  seriesCount?: number
}

/**
 * Result of validating an M3U source
 */
export interface M3UValidationResult {
  /** Whether the source is valid and accessible */
  isValid: boolean
  /** Error message if validation failed */
  error?: string
  /** Number of channels/items found */
  channelCount?: number
  /** Number of categories found */
  categoryCount?: number
  /** EPG URL if found in playlist */
  epgUrl?: string
}

/**
 * Union type for validation results
 */
export type SourceValidationResult = XtreamValidationResult | M3UValidationResult

/**
 * Default timeout for validation requests (15 seconds - shorter for quick feedback)
 */
const VALIDATION_TIMEOUT = 15000

/**
 * Validates an Xtream Codes source by attempting to authenticate and fetch basic content info.
 *
 * @param input - The Xtream source credentials to validate
 * @param timeout - Request timeout in milliseconds (default: 15000)
 * @returns Validation result with server/account info if successful
 *
 * @example
 * ```typescript
 * const result = await validateXtreamSource({
 *   name: 'My Provider',
 *   serverUrl: 'http://example.com:8080',
 *   username: 'user',
 *   password: 'pass',
 * })
 *
 * if (result.isValid) {
 *   console.log(`Found ${result.channelCount} channels`)
 *   console.log(`Account expires: ${result.authResponse?.userInfo.expDate}`)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function validateXtreamSource(
  input: XtreamSourceInput,
  timeout: number = VALIDATION_TIMEOUT
): Promise<XtreamValidationResult> {
  // Basic input validation
  if (!input.serverUrl || !input.serverUrl.trim()) {
    return { isValid: false, error: 'Server URL is required' }
  }

  if (!input.username || !input.username.trim()) {
    return { isValid: false, error: 'Username is required' }
  }

  if (!input.password || !input.password.trim()) {
    return { isValid: false, error: 'Password is required' }
  }

  // Validate URL format
  try {
    new URL(input.serverUrl)
  } catch {
    return { isValid: false, error: 'Invalid server URL format' }
  }

  try {
    const client = new XtreamClient({
      serverUrl: input.serverUrl,
      username: input.username,
      password: input.password,
      timeout,
    })

    // Step 1: Authenticate
    const authResponse = await client.authenticate()

    // Step 2: Check if account is active
    if (!client.isAccountActive()) {
      const status = authResponse.userInfo.status
      const expDate = client.getExpirationDate()

      if (expDate && expDate < new Date()) {
        return {
          isValid: false,
          error: `Account expired on ${expDate.toLocaleDateString()}`,
          authResponse,
        }
      }

      return {
        isValid: false,
        error: `Account status: ${status}. Please contact your provider.`,
        authResponse,
      }
    }

    // Step 3: Try to get content counts (optional, for user feedback)
    let channelCount: number | undefined
    let vodCount: number | undefined
    let seriesCount: number | undefined

    try {
      // Run these in parallel for faster validation
      const [channels, vod, series] = await Promise.all([
        client.getLiveStreams().catch(() => []),
        client.getVODStreams().catch(() => []),
        client.getSeries().catch(() => []),
      ])

      channelCount = channels.length
      vodCount = vod.length
      seriesCount = series.length
    } catch {
      // Content count fetch is optional - ignore errors
    }

    return {
      isValid: true,
      authResponse,
      channelCount,
      vodCount,
      seriesCount,
    }
  } catch (error) {
    // Handle specific error types
    if (error instanceof XtreamApiError) {
      // Make error messages more user-friendly
      const message = error.message.toLowerCase()

      if (message.includes('authentication failed') || message.includes('invalid credentials')) {
        return { isValid: false, error: 'Invalid username or password' }
      }

      if (message.includes('timeout')) {
        return { isValid: false, error: 'Connection timed out. Please check the server URL.' }
      }

      if (error.statusCode === 404) {
        return { isValid: false, error: 'Server not found. Please check the URL.' }
      }

      if (error.statusCode === 403 || error.statusCode === 401) {
        return { isValid: false, error: 'Access denied. Please check your credentials.' }
      }

      return { isValid: false, error: error.message }
    }

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          isValid: false,
          error: 'Unable to connect to server. Please check the URL and your internet connection.',
        }
      }

      return { isValid: false, error: error.message }
    }

    return { isValid: false, error: 'An unknown error occurred' }
  }
}

/**
 * Validates an M3U source by fetching and parsing the playlist.
 *
 * @param input - The M3U source URL to validate
 * @param timeout - Request timeout in milliseconds (default: 15000)
 * @returns Validation result with channel count if successful
 *
 * @example
 * ```typescript
 * const result = await validateM3USource({
 *   name: 'My Playlist',
 *   playlistUrl: 'http://example.com/playlist.m3u',
 * })
 *
 * if (result.isValid) {
 *   console.log(`Found ${result.channelCount} channels in ${result.categoryCount} categories`)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function validateM3USource(
  input: M3USourceInput,
  timeout: number = VALIDATION_TIMEOUT
): Promise<M3UValidationResult> {
  // Basic input validation
  if (!input.playlistUrl || !input.playlistUrl.trim()) {
    return { isValid: false, error: 'Playlist URL is required' }
  }

  // Validate URL format
  try {
    new URL(input.playlistUrl)
  } catch {
    return { isValid: false, error: 'Invalid playlist URL format' }
  }

  // Validate EPG URL if provided
  if (input.epgUrl && input.epgUrl.trim()) {
    try {
      new URL(input.epgUrl)
    } catch {
      return { isValid: false, error: 'Invalid EPG URL format' }
    }
  }

  try {
    // Fetch and parse the playlist
    const playlist = await fetchAndParseM3U(input.playlistUrl, timeout)

    // Check if playlist has any items
    if (!playlist.items || playlist.items.length === 0) {
      return {
        isValid: false,
        error: 'Playlist is empty or contains no valid channels',
      }
    }

    // Adapt the playlist to get categories
    const adapted = adaptM3UPlaylist(playlist, { sourceId: 'validation' })

    return {
      isValid: true,
      channelCount: adapted.channels.length,
      categoryCount: adapted.categories.length,
      epgUrl: playlist.header.epgUrl || input.epgUrl,
    }
  } catch (error) {
    // Handle specific error types
    if (error instanceof M3UParseError) {
      const message = error.message.toLowerCase()

      if (message.includes('timeout')) {
        return { isValid: false, error: 'Connection timed out. Please check the URL.' }
      }

      if (message.includes('404') || message.includes('not found')) {
        return { isValid: false, error: 'Playlist not found. Please check the URL.' }
      }

      if (message.includes('403') || message.includes('forbidden')) {
        return { isValid: false, error: 'Access denied. The playlist URL may require authentication.' }
      }

      if (message.includes('invalid m3u') || message.includes('#extm3u')) {
        return {
          isValid: false,
          error: 'Invalid playlist format. The URL does not point to a valid M3U file.',
        }
      }

      return { isValid: false, error: error.message }
    }

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          isValid: false,
          error: 'Unable to fetch playlist. Please check the URL and your internet connection.',
        }
      }

      return { isValid: false, error: error.message }
    }

    return { isValid: false, error: 'An unknown error occurred' }
  }
}

/**
 * Validates a source based on its type.
 *
 * @param type - The type of source ('xtream' or 'm3u')
 * @param input - The source input data
 * @param timeout - Request timeout in milliseconds (default: 15000)
 * @returns Validation result
 *
 * @example
 * ```typescript
 * // Validate Xtream source
 * const result = await validateSource('xtream', {
 *   name: 'My Provider',
 *   serverUrl: 'http://example.com:8080',
 *   username: 'user',
 *   password: 'pass',
 * })
 *
 * // Validate M3U source
 * const result = await validateSource('m3u', {
 *   name: 'My Playlist',
 *   playlistUrl: 'http://example.com/playlist.m3u',
 * })
 * ```
 */
export async function validateSource(
  type: SourceType,
  input: XtreamSourceInput | M3USourceInput,
  timeout: number = VALIDATION_TIMEOUT
): Promise<SourceValidationResult> {
  if (type === 'xtream') {
    return validateXtreamSource(input as XtreamSourceInput, timeout)
  }

  if (type === 'm3u') {
    return validateM3USource(input as M3USourceInput, timeout)
  }

  return { isValid: false, error: 'Unknown source type' }
}

/**
 * Type guard to check if a validation result is for an Xtream source
 */
export function isXtreamValidationResult(
  result: SourceValidationResult
): result is XtreamValidationResult {
  return 'authResponse' in result || 'vodCount' in result || 'seriesCount' in result
}

/**
 * Type guard to check if a validation result is for an M3U source
 */
export function isM3UValidationResult(
  result: SourceValidationResult
): result is M3UValidationResult {
  return 'categoryCount' in result
}

/**
 * Formats a validation result into a user-friendly success message.
 *
 * @param result - The validation result
 * @returns A formatted success message string
 */
export function formatValidationSuccess(result: SourceValidationResult): string {
  if (!result.isValid) {
    return ''
  }

  const parts: string[] = []

  if (result.channelCount !== undefined) {
    parts.push(`${result.channelCount} channel${result.channelCount !== 1 ? 's' : ''}`)
  }

  if (isXtreamValidationResult(result)) {
    if (result.vodCount !== undefined && result.vodCount > 0) {
      parts.push(`${result.vodCount} movie${result.vodCount !== 1 ? 's' : ''}`)
    }

    if (result.seriesCount !== undefined && result.seriesCount > 0) {
      parts.push(`${result.seriesCount} series`)
    }
  }

  if (isM3UValidationResult(result) && result.categoryCount !== undefined) {
    parts.push(`${result.categoryCount} categor${result.categoryCount !== 1 ? 'ies' : 'y'}`)
  }

  if (parts.length === 0) {
    return 'Connection successful'
  }

  return `Found ${parts.join(', ')}`
}
