/**
 * Tests for M3U Adapter
 */

import { describe, it, expect } from 'vitest'
import type { M3UPlaylist, M3UItem } from './m3uParser'
import {
  generateCategoryId,
  generateChannelId,
  detectStreamType,
  extractCategories,
  extractChannels,
  adaptM3UPlaylist,
  getChannelsByCategory,
  findChannelByEpgId,
  getChannelCountByCategory,
} from './m3uAdapter'

// Helper to create mock M3U items
function createMockItem(overrides: Partial<M3UItem> = {}): M3UItem {
  return {
    name: 'Test Channel',
    url: 'http://example.com/stream.m3u8',
    lineNumber: 1,
    raw: '#EXTINF:-1,Test Channel',
    ...overrides,
  }
}

// Helper to create mock playlist
function createMockPlaylist(
  items: M3UItem[],
  epgUrl?: string
): M3UPlaylist {
  return {
    header: {
      epgUrl,
      raw: '#EXTM3U',
    },
    items,
  }
}

describe('generateCategoryId', () => {
  it('should generate a sanitized category ID', () => {
    expect(generateCategoryId('News & Sports', 'src1')).toBe('src1-cat-news-sports')
  })

  it('should handle special characters', () => {
    expect(generateCategoryId('Movies (HD)', 'src1')).toBe('src1-cat-movies-hd')
  })

  it('should handle spaces and mixed case', () => {
    expect(generateCategoryId('LIVE TV Channels', 'mySource')).toBe('mySource-cat-live-tv-channels')
  })

  it('should handle empty strings', () => {
    expect(generateCategoryId('', 'src1')).toBe('src1-cat-unknown')
  })

  it('should handle only special characters', () => {
    expect(generateCategoryId('!@#$%', 'src1')).toBe('src1-cat-unknown')
  })
})

describe('generateChannelId', () => {
  it('should use tvgId when available', () => {
    const item = createMockItem({ tvgId: 'ESPN.US' })
    expect(generateChannelId(item, 5, 'src1')).toBe('src1-ch-espn-us')
  })

  it('should fall back to index when tvgId is not available', () => {
    const item = createMockItem({ tvgId: undefined })
    expect(generateChannelId(item, 5, 'src1')).toBe('src1-ch-5')
  })

  it('should sanitize tvgId with special characters', () => {
    const item = createMockItem({ tvgId: 'channel_123@test' })
    expect(generateChannelId(item, 0, 'src1')).toBe('src1-ch-channel-123-test')
  })
})

describe('detectStreamType', () => {
  it('should detect HLS streams by .m3u8 extension', () => {
    expect(detectStreamType('http://example.com/live/stream.m3u8')).toBe('hls')
  })

  it('should detect HLS streams by /hls/ path', () => {
    expect(detectStreamType('http://example.com/hls/channel/index')).toBe('hls')
  })

  it('should detect DASH streams by .mpd extension', () => {
    expect(detectStreamType('http://example.com/stream/manifest.mpd')).toBe('dash')
  })

  it('should detect DASH streams by /dash/ path', () => {
    expect(detectStreamType('http://example.com/dash/channel/stream')).toBe('dash')
  })

  it('should detect live streams by /live/ path', () => {
    expect(detectStreamType('http://example.com/live/channel1')).toBe('live')
  })

  it('should detect live streams by live. subdomain', () => {
    expect(detectStreamType('http://live.example.com/channel')).toBe('live')
  })

  it('should detect live streams by .ts extension', () => {
    expect(detectStreamType('http://example.com/stream/video.ts')).toBe('live')
  })

  it('should return unknown for unrecognized URLs', () => {
    expect(detectStreamType('http://example.com/video/stream')).toBe('unknown')
  })

  it('should be case insensitive', () => {
    expect(detectStreamType('HTTP://EXAMPLE.COM/STREAM.M3U8')).toBe('hls')
    expect(detectStreamType('http://example.com/LIVE/channel')).toBe('live')
  })
})

describe('extractCategories', () => {
  it('should extract unique categories from playlist', () => {
    const items = [
      createMockItem({ group: 'News' }),
      createMockItem({ group: 'Sports' }),
      createMockItem({ group: 'News' }), // duplicate
    ]
    const playlist = createMockPlaylist(items)

    const categories = extractCategories(playlist, { sourceId: 'test' })

    expect(categories).toHaveLength(2)
    expect(categories.map((c) => c.name)).toContain('News')
    expect(categories.map((c) => c.name)).toContain('Sports')
  })

  it('should add default category for ungrouped items', () => {
    const items = [
      createMockItem({ group: 'News' }),
      createMockItem({ group: undefined }),
    ]
    const playlist = createMockPlaylist(items)

    const categories = extractCategories(playlist, { sourceId: 'test' })

    expect(categories).toHaveLength(2)
    expect(categories.map((c) => c.name)).toContain('Uncategorized')
  })

  it('should use custom default category name', () => {
    const items = [createMockItem({ group: undefined })]
    const playlist = createMockPlaylist(items)

    const categories = extractCategories(playlist, {
      sourceId: 'test',
      defaultCategoryName: 'Other',
      defaultCategoryId: 'other',
    })

    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Other')
  })

  it('should not add default category when all items are grouped', () => {
    const items = [
      createMockItem({ group: 'News' }),
      createMockItem({ group: 'Sports' }),
    ]
    const playlist = createMockPlaylist(items)

    const categories = extractCategories(playlist, { sourceId: 'test' })

    expect(categories).toHaveLength(2)
    expect(categories.map((c) => c.name)).not.toContain('Uncategorized')
  })

  it('should return empty array for empty playlist', () => {
    const playlist = createMockPlaylist([])

    const categories = extractCategories(playlist, { sourceId: 'test' })

    expect(categories).toHaveLength(0)
  })
})

describe('extractChannels', () => {
  it('should extract channels with all properties', () => {
    const items = [
      createMockItem({
        name: 'ESPN HD',
        url: 'http://example.com/espn.m3u8',
        tvgId: 'ESPN.US',
        tvgLogo: 'http://example.com/espn-logo.png',
        group: 'Sports',
      }),
    ]
    const playlist = createMockPlaylist(items)

    const channels = extractChannels(playlist, { sourceId: 'test' })

    expect(channels).toHaveLength(1)
    expect(channels[0]).toEqual({
      id: 'test-ch-espn-us',
      name: 'ESPN HD',
      number: 1,
      logo: 'http://example.com/espn-logo.png',
      categoryId: 'test-cat-sports',
      streamUrl: 'http://example.com/espn.m3u8',
      streamType: 'hls',
      epgChannelId: 'ESPN.US',
      isAvailable: true,
    })
  })

  it('should assign sequential numbers to channels', () => {
    const items = [
      createMockItem({ name: 'Channel 1' }),
      createMockItem({ name: 'Channel 2' }),
      createMockItem({ name: 'Channel 3' }),
    ]
    const playlist = createMockPlaylist(items)

    const channels = extractChannels(playlist, { sourceId: 'test' })

    expect(channels[0].number).toBe(1)
    expect(channels[1].number).toBe(2)
    expect(channels[2].number).toBe(3)
  })

  it('should use tvgName as fallback for epgChannelId', () => {
    const items = [
      createMockItem({
        tvgId: undefined,
        tvgName: 'ESPN Alternative',
      }),
    ]
    const playlist = createMockPlaylist(items)

    const channels = extractChannels(playlist, { sourceId: 'test' })

    expect(channels[0].epgChannelId).toBe('ESPN Alternative')
  })

  it('should assign default category for ungrouped channels', () => {
    const items = [createMockItem({ group: undefined })]
    const playlist = createMockPlaylist(items)

    const channels = extractChannels(playlist, {
      sourceId: 'test',
      defaultCategoryId: 'misc',
    })

    expect(channels[0].categoryId).toBe('test-cat-misc')
  })

  it('should handle empty logo', () => {
    const items = [createMockItem({ tvgLogo: undefined })]
    const playlist = createMockPlaylist(items)

    const channels = extractChannels(playlist, { sourceId: 'test' })

    expect(channels[0].logo).toBeUndefined()
  })
})

describe('adaptM3UPlaylist', () => {
  it('should return categories, channels, and epgUrl', () => {
    const items = [
      createMockItem({ name: 'ESPN', group: 'Sports', tvgId: 'espn' }),
      createMockItem({ name: 'CNN', group: 'News', tvgId: 'cnn' }),
    ]
    const playlist = createMockPlaylist(items, 'http://example.com/epg.xml')

    const result = adaptM3UPlaylist(playlist, { sourceId: 'mylist' })

    expect(result.categories).toHaveLength(2)
    expect(result.channels).toHaveLength(2)
    expect(result.epgUrl).toBe('http://example.com/epg.xml')
  })

  it('should handle playlist without EPG URL', () => {
    const items = [createMockItem()]
    const playlist = createMockPlaylist(items)

    const result = adaptM3UPlaylist(playlist)

    expect(result.epgUrl).toBeUndefined()
  })

  it('should use default options when none provided', () => {
    const items = [createMockItem({ group: 'Test' })]
    const playlist = createMockPlaylist(items)

    const result = adaptM3UPlaylist(playlist)

    expect(result.channels[0].id).toMatch(/^m3u-ch-/)
    expect(result.categories[0].id).toMatch(/^m3u-cat-/)
  })
})

describe('getChannelsByCategory', () => {
  it('should filter channels by category ID', () => {
    const channels = [
      { id: '1', name: 'ESPN', categoryId: 'sports', streamUrl: '', number: 1 },
      { id: '2', name: 'CNN', categoryId: 'news', streamUrl: '', number: 2 },
      { id: '3', name: 'Fox Sports', categoryId: 'sports', streamUrl: '', number: 3 },
    ]

    const sportsChannels = getChannelsByCategory(channels, 'sports')

    expect(sportsChannels).toHaveLength(2)
    expect(sportsChannels.map((c) => c.name)).toEqual(['ESPN', 'Fox Sports'])
  })

  it('should return empty array when no channels match', () => {
    const channels = [
      { id: '1', name: 'ESPN', categoryId: 'sports', streamUrl: '', number: 1 },
    ]

    const result = getChannelsByCategory(channels, 'movies')

    expect(result).toHaveLength(0)
  })
})

describe('findChannelByEpgId', () => {
  it('should find channel by EPG ID', () => {
    const channels = [
      { id: '1', name: 'ESPN', epgChannelId: 'espn.us', categoryId: 'sports', streamUrl: '' },
      { id: '2', name: 'CNN', epgChannelId: 'cnn.us', categoryId: 'news', streamUrl: '' },
    ]

    const channel = findChannelByEpgId(channels, 'cnn.us')

    expect(channel).toBeDefined()
    expect(channel?.name).toBe('CNN')
  })

  it('should return undefined when no channel matches', () => {
    const channels = [
      { id: '1', name: 'ESPN', epgChannelId: 'espn.us', categoryId: 'sports', streamUrl: '' },
    ]

    const channel = findChannelByEpgId(channels, 'unknown')

    expect(channel).toBeUndefined()
  })

  it('should handle channels without epgChannelId', () => {
    const channels = [
      { id: '1', name: 'ESPN', categoryId: 'sports', streamUrl: '' },
    ]

    const channel = findChannelByEpgId(channels, 'espn')

    expect(channel).toBeUndefined()
  })
})

describe('getChannelCountByCategory', () => {
  it('should count channels per category', () => {
    const channels = [
      { id: '1', categoryId: 'sports', name: '', streamUrl: '' },
      { id: '2', categoryId: 'news', name: '', streamUrl: '' },
      { id: '3', categoryId: 'sports', name: '', streamUrl: '' },
      { id: '4', categoryId: 'sports', name: '', streamUrl: '' },
      { id: '5', categoryId: 'movies', name: '', streamUrl: '' },
    ]

    const counts = getChannelCountByCategory(channels)

    expect(counts).toEqual({
      sports: 3,
      news: 1,
      movies: 1,
    })
  })

  it('should return empty object for empty channel list', () => {
    const counts = getChannelCountByCategory([])

    expect(counts).toEqual({})
  })
})
