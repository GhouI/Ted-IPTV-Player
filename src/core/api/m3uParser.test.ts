/**
 * Tests for M3U playlist parser wrapper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseM3U,
  fetchAndParseM3U,
  extractGroups,
  filterByGroup,
  filterUngrouped,
  hasEPGInfo,
  getEPGIdentifier,
  M3UParseError,
  type M3UPlaylist,
  type M3UItem,
} from './m3uParser'

describe('M3U Parser', () => {
  describe('parseM3U', () => {
    it('should parse a basic M3U playlist', () => {
      const content = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8
#EXTINF:-1,Channel 2
http://example.com/stream2.m3u8`

      const result = parseM3U(content)

      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('Channel 1')
      expect(result.items[0].url).toBe('http://example.com/stream1.m3u8')
      expect(result.items[1].name).toBe('Channel 2')
      expect(result.items[1].url).toBe('http://example.com/stream2.m3u8')
    })

    it('should parse playlist with TVG attributes', () => {
      const content = `#EXTM3U
#EXTINF:-1 tvg-id="ch1" tvg-name="Channel One" tvg-logo="http://example.com/logo1.png",Channel 1
http://example.com/stream1.m3u8`

      const result = parseM3U(content)

      expect(result.items[0].tvgId).toBe('ch1')
      expect(result.items[0].tvgName).toBe('Channel One')
      expect(result.items[0].tvgLogo).toBe('http://example.com/logo1.png')
    })

    it('should parse playlist with group-title', () => {
      const content = `#EXTM3U
#EXTINF:-1 group-title="News",News Channel
http://example.com/news.m3u8
#EXTINF:-1 group-title="Sports",Sports Channel
http://example.com/sports.m3u8`

      const result = parseM3U(content)

      expect(result.items[0].group).toBe('News')
      expect(result.items[1].group).toBe('Sports')
    })

    it('should parse playlist header with EPG URL', () => {
      const content = `#EXTM3U url-tvg="http://example.com/epg.xml" x-tvg-url="http://example.com/epg.xml"
#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8`

      const result = parseM3U(content)

      expect(result.header.epgUrl).toBe('http://example.com/epg.xml')
    })

    it('should handle empty group values as undefined', () => {
      const content = `#EXTM3U
#EXTINF:-1 tvg-id="" group-title="",Channel 1
http://example.com/stream1.m3u8`

      const result = parseM3U(content)

      expect(result.items[0].tvgId).toBeUndefined()
      expect(result.items[0].group).toBeUndefined()
    })

    it('should throw M3UParseError for invalid input', () => {
      expect(() => parseM3U('')).toThrow(M3UParseError)
      expect(() => parseM3U('')).toThrow('Invalid input: content must be a non-empty string')
    })

    it('should throw M3UParseError for non-M3U content', () => {
      expect(() => parseM3U('This is not an M3U file')).toThrow(M3UParseError)
      expect(() => parseM3U('This is not an M3U file')).toThrow('Invalid M3U format: content must start with #EXTM3U header')
    })

    it('should parse playlist with HTTP attributes', () => {
      const content = `#EXTM3U
#EXTINF:-1 http-referrer="http://example.com" http-user-agent="MyPlayer/1.0",Channel 1
http://example.com/stream1.m3u8`

      const result = parseM3U(content)

      // Note: The parser may handle these differently based on the library
      expect(result.items[0].name).toBe('Channel 1')
    })

    it('should throw error for playlist without EXTM3U header', () => {
      const content = `#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8`

      // The library requires #EXTM3U header for valid M3U format
      expect(() => parseM3U(content)).toThrow(M3UParseError)
    })

    it('should preserve line numbers', () => {
      const content = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8
#EXTINF:-1,Channel 2
http://example.com/stream2.m3u8`

      const result = parseM3U(content)

      expect(result.items[0].lineNumber).toBeDefined()
      expect(typeof result.items[0].lineNumber).toBe('number')
    })

    it('should preserve raw EXTINF content', () => {
      const content = `#EXTM3U
#EXTINF:-1 tvg-id="ch1",Channel 1
http://example.com/stream1.m3u8`

      const result = parseM3U(content)

      expect(result.items[0].raw).toBeDefined()
      expect(result.items[0].raw).toContain('#EXTINF')
    })
  })

  describe('fetchAndParseM3U', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should fetch and parse a remote playlist', async () => {
      const mockContent = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8`

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response)

      const result = await fetchAndParseM3U('http://example.com/playlist.m3u')

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Channel 1')
      expect(fetch).toHaveBeenCalledWith(
        'http://example.com/playlist.m3u',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      )
    })

    it('should throw M3UParseError for invalid URL', async () => {
      await expect(fetchAndParseM3U('not-a-url')).rejects.toThrow(M3UParseError)
      await expect(fetchAndParseM3U('not-a-url')).rejects.toThrow('Invalid URL format')
    })

    it('should throw M3UParseError for empty URL', async () => {
      await expect(fetchAndParseM3U('')).rejects.toThrow(M3UParseError)
      await expect(fetchAndParseM3U('')).rejects.toThrow('Invalid input: url must be a non-empty string')
    })

    it('should throw M3UParseError for HTTP errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(fetchAndParseM3U('http://example.com/playlist.m3u')).rejects.toThrow(
        'HTTP 404 Not Found'
      )
    })

    it('should handle fetch timeout', async () => {
      vi.mocked(fetch).mockImplementationOnce(() => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      await expect(fetchAndParseM3U('http://example.com/playlist.m3u', 100)).rejects.toThrow(
        'Request timeout'
      )
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchAndParseM3U('http://example.com/playlist.m3u')).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('extractGroups', () => {
    it('should extract unique group names', () => {
      const playlist: M3UPlaylist = {
        header: { raw: '#EXTM3U' },
        items: [
          { name: 'Ch1', url: 'http://a.com/1', group: 'News', lineNumber: 1, raw: '' },
          { name: 'Ch2', url: 'http://a.com/2', group: 'Sports', lineNumber: 2, raw: '' },
          { name: 'Ch3', url: 'http://a.com/3', group: 'News', lineNumber: 3, raw: '' },
          { name: 'Ch4', url: 'http://a.com/4', group: 'Movies', lineNumber: 4, raw: '' },
        ],
      }

      const groups = extractGroups(playlist)

      expect(groups).toEqual(['Movies', 'News', 'Sports'])
    })

    it('should return empty array for playlist without groups', () => {
      const playlist: M3UPlaylist = {
        header: { raw: '#EXTM3U' },
        items: [
          { name: 'Ch1', url: 'http://a.com/1', lineNumber: 1, raw: '' },
          { name: 'Ch2', url: 'http://a.com/2', lineNumber: 2, raw: '' },
        ],
      }

      const groups = extractGroups(playlist)

      expect(groups).toEqual([])
    })

    it('should ignore undefined groups', () => {
      const playlist: M3UPlaylist = {
        header: { raw: '#EXTM3U' },
        items: [
          { name: 'Ch1', url: 'http://a.com/1', group: 'News', lineNumber: 1, raw: '' },
          { name: 'Ch2', url: 'http://a.com/2', group: undefined, lineNumber: 2, raw: '' },
        ],
      }

      const groups = extractGroups(playlist)

      expect(groups).toEqual(['News'])
    })
  })

  describe('filterByGroup', () => {
    const playlist: M3UPlaylist = {
      header: { raw: '#EXTM3U' },
      items: [
        { name: 'Ch1', url: 'http://a.com/1', group: 'News', lineNumber: 1, raw: '' },
        { name: 'Ch2', url: 'http://a.com/2', group: 'Sports', lineNumber: 2, raw: '' },
        { name: 'Ch3', url: 'http://a.com/3', group: 'News', lineNumber: 3, raw: '' },
      ],
    }

    it('should filter items by group name', () => {
      const newsItems = filterByGroup(playlist, 'News')

      expect(newsItems).toHaveLength(2)
      expect(newsItems[0].name).toBe('Ch1')
      expect(newsItems[1].name).toBe('Ch3')
    })

    it('should return empty array for non-existent group', () => {
      const items = filterByGroup(playlist, 'Movies')

      expect(items).toEqual([])
    })
  })

  describe('filterUngrouped', () => {
    it('should return items without a group', () => {
      const playlist: M3UPlaylist = {
        header: { raw: '#EXTM3U' },
        items: [
          { name: 'Ch1', url: 'http://a.com/1', group: 'News', lineNumber: 1, raw: '' },
          { name: 'Ch2', url: 'http://a.com/2', lineNumber: 2, raw: '' },
          { name: 'Ch3', url: 'http://a.com/3', group: undefined, lineNumber: 3, raw: '' },
        ],
      }

      const ungrouped = filterUngrouped(playlist)

      expect(ungrouped).toHaveLength(2)
      expect(ungrouped[0].name).toBe('Ch2')
      expect(ungrouped[1].name).toBe('Ch3')
    })
  })

  describe('hasEPGInfo', () => {
    it('should return true when tvgId is present', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        tvgId: 'channel1',
        lineNumber: 1,
        raw: '',
      }

      expect(hasEPGInfo(item)).toBe(true)
    })

    it('should return true when tvgName is present', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        tvgName: 'Channel One',
        lineNumber: 1,
        raw: '',
      }

      expect(hasEPGInfo(item)).toBe(true)
    })

    it('should return false when neither tvgId nor tvgName is present', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        lineNumber: 1,
        raw: '',
      }

      expect(hasEPGInfo(item)).toBe(false)
    })
  })

  describe('getEPGIdentifier', () => {
    it('should prefer tvgId over tvgName', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        tvgId: 'channel1',
        tvgName: 'Channel One',
        lineNumber: 1,
        raw: '',
      }

      expect(getEPGIdentifier(item)).toBe('channel1')
    })

    it('should return tvgName when tvgId is not present', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        tvgName: 'Channel One',
        lineNumber: 1,
        raw: '',
      }

      expect(getEPGIdentifier(item)).toBe('Channel One')
    })

    it('should return undefined when neither is present', () => {
      const item: M3UItem = {
        name: 'Ch1',
        url: 'http://a.com/1',
        lineNumber: 1,
        raw: '',
      }

      expect(getEPGIdentifier(item)).toBeUndefined()
    })
  })

  describe('M3UParseError', () => {
    it('should have correct name and message', () => {
      const error = new M3UParseError('Test error')

      expect(error.name).toBe('M3UParseError')
      expect(error.message).toBe('Test error')
    })

    it('should store the cause', () => {
      const cause = new Error('Original error')
      const error = new M3UParseError('Wrapped error', cause)

      expect(error.cause).toBe(cause)
    })
  })
})
