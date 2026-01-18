/**
 * M3U playlist parser wrapper
 *
 * Wraps the iptv-playlist-parser library to provide a typed interface
 * for parsing M3U/M3U8 playlist files commonly used for IPTV.
 */

import { parse } from 'iptv-playlist-parser'

/**
 * Parsed M3U playlist item representing a single channel/stream
 */
export interface M3UItem {
  /** Channel name from the EXTINF line */
  name: string
  /** Stream URL */
  url: string
  /** TVG ID for EPG mapping */
  tvgId?: string
  /** TVG name (alternative name for EPG) */
  tvgName?: string
  /** TVG logo URL */
  tvgLogo?: string
  /** TVG URL for EPG data */
  tvgUrl?: string
  /** TVG rec attribute */
  tvgRec?: string
  /** TVG shift for timezone adjustment */
  tvgShift?: string
  /** Group/category title */
  group?: string
  /** HTTP referrer for stream requests */
  httpReferrer?: string
  /** HTTP user agent for stream requests */
  httpUserAgent?: string
  /** Timeshift value */
  timeshift?: string
  /** Catchup type (e.g., 'default', 'flussonic') */
  catchupType?: string
  /** Catchup source URL template */
  catchupSource?: string
  /** Catchup days available */
  catchupDays?: string
  /** Language code */
  language?: string
  /** Original line number in the playlist */
  lineNumber: number
  /** Raw EXTINF line content */
  raw: string
}

/**
 * Parsed M3U playlist header
 */
export interface M3UHeader {
  /** URL to external EPG/XMLTV file */
  epgUrl?: string
  /** Raw header content */
  raw: string
}

/**
 * Complete parsed M3U playlist
 */
export interface M3UPlaylist {
  /** Playlist header with metadata */
  header: M3UHeader
  /** Array of playlist items (channels/streams) */
  items: M3UItem[]
}

/**
 * Error thrown when M3U parsing fails
 */
export class M3UParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'M3UParseError'
  }
}

/**
 * Normalizes empty strings to undefined
 */
function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Parses an M3U playlist content string into a structured format
 *
 * @param content - The raw M3U playlist content as a string
 * @returns Parsed playlist with header and items
 * @throws M3UParseError if parsing fails
 *
 * @example
 * ```typescript
 * const playlist = parseM3U(`
 *   #EXTM3U url-tvg="http://example.com/epg.xml"
 *   #EXTINF:-1 tvg-id="channel1" tvg-name="Channel 1" tvg-logo="http://example.com/logo.png" group-title="News",Channel 1 HD
 *   http://example.com/stream1.m3u8
 * `)
 *
 * console.log(playlist.items[0].name) // "Channel 1 HD"
 * console.log(playlist.items[0].group) // "News"
 * ```
 */
export function parseM3U(content: string): M3UPlaylist {
  if (!content || typeof content !== 'string') {
    throw new M3UParseError('Invalid input: content must be a non-empty string')
  }

  // Check for M3U header - the library requires #EXTM3U
  const trimmedContent = content.trim()
  if (!trimmedContent.startsWith('#EXTM3U')) {
    throw new M3UParseError('Invalid M3U format: content must start with #EXTM3U header')
  }

  try {
    const parsed = parse(content)

    // Transform header
    const header: M3UHeader = {
      epgUrl: emptyToUndefined(parsed.header.attrs['x-tvg-url']),
      raw: parsed.header.raw,
    }

    // Transform items
    const items: M3UItem[] = parsed.items.map((item) => ({
      name: item.name || 'Unnamed Channel',
      url: item.url,
      tvgId: emptyToUndefined(item.tvg?.id),
      tvgName: emptyToUndefined(item.tvg?.name),
      tvgLogo: emptyToUndefined(item.tvg?.logo),
      tvgUrl: emptyToUndefined(item.tvg?.url),
      tvgRec: emptyToUndefined(item.tvg?.rec),
      tvgShift: emptyToUndefined(item.tvg?.shift),
      group: emptyToUndefined(item.group?.title),
      httpReferrer: emptyToUndefined(item.http?.referrer),
      httpUserAgent: emptyToUndefined(item.http?.['user-agent']),
      timeshift: emptyToUndefined(item.timeshift),
      catchupType: emptyToUndefined(item.catchup?.type),
      catchupSource: emptyToUndefined(item.catchup?.source),
      catchupDays: emptyToUndefined(item.catchup?.days),
      language: emptyToUndefined(item.lang),
      lineNumber: item.line,
      raw: item.raw,
    }))

    return { header, items }
  } catch (error) {
    if (error instanceof M3UParseError) {
      throw error
    }
    throw new M3UParseError(
      `Failed to parse M3U content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    )
  }
}

/**
 * Fetches and parses an M3U playlist from a URL
 *
 * @param url - URL to the M3U playlist file
 * @param timeout - Request timeout in milliseconds (default: 30000)
 * @returns Parsed playlist with header and items
 * @throws M3UParseError if fetching or parsing fails
 *
 * @example
 * ```typescript
 * const playlist = await fetchAndParseM3U('http://example.com/playlist.m3u')
 * console.log(`Found ${playlist.items.length} channels`)
 * ```
 */
export async function fetchAndParseM3U(
  url: string,
  timeout: number = 30000
): Promise<M3UPlaylist> {
  if (!url || typeof url !== 'string') {
    throw new M3UParseError('Invalid input: url must be a non-empty string')
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new M3UParseError(`Invalid URL format: ${url}`)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'audio/x-mpegurl, application/x-mpegURL, application/vnd.apple.mpegurl, */*',
      },
    })

    if (!response.ok) {
      throw new M3UParseError(
        `Failed to fetch M3U playlist: HTTP ${response.status} ${response.statusText}`
      )
    }

    const content = await response.text()
    return parseM3U(content)
  } catch (error) {
    if (error instanceof M3UParseError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new M3UParseError(`Request timeout after ${timeout}ms`)
      }
      throw new M3UParseError(`Failed to fetch M3U playlist: ${error.message}`, error)
    }

    throw new M3UParseError('Failed to fetch M3U playlist: Unknown error', error)
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extracts unique group names from a parsed playlist
 *
 * @param playlist - The parsed M3U playlist
 * @returns Array of unique group/category names
 */
export function extractGroups(playlist: M3UPlaylist): string[] {
  const groups = new Set<string>()
  for (const item of playlist.items) {
    if (item.group) {
      groups.add(item.group)
    }
  }
  return Array.from(groups).sort()
}

/**
 * Filters playlist items by group name
 *
 * @param playlist - The parsed M3U playlist
 * @param group - The group name to filter by
 * @returns Array of items matching the group
 */
export function filterByGroup(playlist: M3UPlaylist, group: string): M3UItem[] {
  return playlist.items.filter((item) => item.group === group)
}

/**
 * Filters playlist items that have no group assigned
 *
 * @param playlist - The parsed M3U playlist
 * @returns Array of items without a group
 */
export function filterUngrouped(playlist: M3UPlaylist): M3UItem[] {
  return playlist.items.filter((item) => !item.group)
}

/**
 * Checks if a playlist item has EPG information
 *
 * @param item - The M3U item to check
 * @returns true if the item has a tvgId or tvgName
 */
export function hasEPGInfo(item: M3UItem): boolean {
  return !!(item.tvgId || item.tvgName)
}

/**
 * Gets the EPG identifier for an item (prefers tvgId over tvgName)
 *
 * @param item - The M3U item
 * @returns The EPG identifier or undefined
 */
export function getEPGIdentifier(item: M3UItem): string | undefined {
  return item.tvgId || item.tvgName
}
