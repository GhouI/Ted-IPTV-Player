/**
 * Tests for SourceNormalizer
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import {
  SourceNormalizer,
  createSourceNormalizer,
  SourceNormalizerError,
} from './sourceNormalizer'
import type { XtreamSource, M3USource } from '../types/source'
import type { Category, Channel } from '../types/channel'
import type { VODCategory, VODItem, Series, SeriesInfo } from '../types/vod'

// Define mock client interface
interface MockXtreamClient {
  authenticate: Mock
  isAccountActive: Mock
  getLiveCategories: Mock
  getLiveStreams: Mock
  getVODCategories: Mock
  getVODStreams: Mock
  getSeriesCategories: Mock
  getSeries: Mock
  getSeriesInfo: Mock
  getEPG: Mock
}

// Mock the dependencies
vi.mock('./xtreamClient', () => ({
  XtreamClient: vi.fn().mockImplementation(() => ({
    authenticate: vi.fn(),
    isAccountActive: vi.fn(),
    getLiveCategories: vi.fn(),
    getLiveStreams: vi.fn(),
    getVODCategories: vi.fn(),
    getVODStreams: vi.fn(),
    getSeriesCategories: vi.fn(),
    getSeries: vi.fn(),
    getSeriesInfo: vi.fn(),
    getEPG: vi.fn(),
  })),
  XtreamApiError: class XtreamApiError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'XtreamApiError'
    }
  },
}))

vi.mock('./m3uParser', () => ({
  fetchAndParseM3U: vi.fn(),
  M3UParseError: class M3UParseError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'M3UParseError'
    }
  },
}))

vi.mock('./m3uAdapter', () => ({
  adaptM3UPlaylist: vi.fn(),
}))

// Import mocked modules
import { XtreamClient, XtreamApiError } from './xtreamClient'
import { fetchAndParseM3U, M3UParseError } from './m3uParser'
import { adaptM3UPlaylist } from './m3uAdapter'

const mockXtreamSource: XtreamSource = {
  id: 'xtream-1',
  name: 'Test Xtream',
  type: 'xtream',
  serverUrl: 'http://example.com:8080',
  username: 'testuser',
  password: 'testpass',
  createdAt: Date.now(),
}

const mockM3USource: M3USource = {
  id: 'm3u-1',
  name: 'Test M3U',
  type: 'm3u',
  playlistUrl: 'http://example.com/playlist.m3u',
  epgUrl: 'http://example.com/epg.xml',
  createdAt: Date.now(),
}

const mockCategories: Category[] = [
  { id: '1', name: 'News' },
  { id: '2', name: 'Sports' },
]

const mockChannels: Channel[] = [
  {
    id: '101',
    name: 'CNN',
    categoryId: '1',
    streamUrl: 'http://example.com/stream/101.ts',
    streamType: 'live',
  },
  {
    id: '102',
    name: 'ESPN',
    categoryId: '2',
    streamUrl: 'http://example.com/stream/102.ts',
    streamType: 'live',
  },
]

const mockVODCategories: VODCategory[] = [
  { id: '10', name: 'Action' },
  { id: '20', name: 'Comedy' },
]

const mockVODItems: VODItem[] = [
  {
    id: '1001',
    title: 'Test Movie',
    categoryId: '10',
    streamUrl: 'http://example.com/movie/1001.mkv',
  },
]

const mockSeries: Series[] = [
  {
    id: '2001',
    title: 'Test Series',
    categoryId: '10',
  },
]

const mockSeriesInfo: SeriesInfo = {
  series: mockSeries[0],
  seasons: [{ id: 's1', seriesId: '2001', seasonNumber: 1 }],
  episodes: {
    s1: [
      {
        id: 'e1',
        seriesId: '2001',
        seasonId: 's1',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Pilot',
        streamUrl: 'http://example.com/series/e1.mkv',
      },
    ],
  },
}

describe('SourceNormalizer', () => {
  let mockClient: MockXtreamClient

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock client with proper typing
    mockClient = {
      authenticate: vi.fn().mockResolvedValue({
        userInfo: { status: 'Active' },
        serverInfo: { url: 'http://example.com' },
      }),
      isAccountActive: vi.fn().mockReturnValue(true),
      getLiveCategories: vi.fn().mockResolvedValue(mockCategories),
      getLiveStreams: vi.fn().mockResolvedValue(mockChannels),
      getVODCategories: vi.fn().mockResolvedValue(mockVODCategories),
      getVODStreams: vi.fn().mockResolvedValue(mockVODItems),
      getSeriesCategories: vi.fn().mockResolvedValue(mockVODCategories),
      getSeries: vi.fn().mockResolvedValue(mockSeries),
      getSeriesInfo: vi.fn().mockResolvedValue(mockSeriesInfo),
      getEPG: vi.fn().mockResolvedValue({ programs: {}, lastUpdated: Date.now() }),
    }

    // Make XtreamClient.fromSource return our mock
    ;(XtreamClient as unknown as { fromSource: Mock }).fromSource = vi
      .fn()
      .mockReturnValue(mockClient)
    vi.mocked(XtreamClient).mockImplementation(() => mockClient as unknown as XtreamClient)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('creates normalizer for Xtream source', () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      expect(normalizer.getSourceType()).toBe('xtream')
      expect(normalizer.getSourceId()).toBe('xtream-1')
      expect(normalizer.getSourceName()).toBe('Test Xtream')
    })

    it('creates normalizer for M3U source', () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      expect(normalizer.getSourceType()).toBe('m3u')
      expect(normalizer.getSourceId()).toBe('m3u-1')
      expect(normalizer.getSourceName()).toBe('Test M3U')
    })
  })

  describe('createSourceNormalizer', () => {
    it('creates a SourceNormalizer instance', () => {
      const normalizer = createSourceNormalizer(mockXtreamSource)
      expect(normalizer).toBeInstanceOf(SourceNormalizer)
    })
  })

  describe('validate', () => {
    describe('Xtream source', () => {
      it('returns valid when authentication succeeds', async () => {
        const normalizer = new SourceNormalizer(mockXtreamSource)
        const result = await normalizer.validate()

        expect(result.isValid).toBe(true)
        expect(result.authResponse).toBeDefined()
        expect(result.channelCount).toBe(2)
      })

      it('returns invalid when account is not active', async () => {
        mockClient.isAccountActive.mockReturnValue(false)

        const normalizer = new SourceNormalizer(mockXtreamSource)
        const result = await normalizer.validate()

        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Account is not active or has expired')
      })

      it('returns invalid when authentication fails', async () => {
        mockClient.authenticate.mockRejectedValue(new XtreamApiError('Invalid credentials'))

        const normalizer = new SourceNormalizer(mockXtreamSource)
        const result = await normalizer.validate()

        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Invalid credentials')
      })
    })

    describe('M3U source', () => {
      it('returns valid when playlist is fetched successfully', async () => {
        vi.mocked(fetchAndParseM3U).mockResolvedValue({
          header: { raw: '#EXTM3U' },
          items: [],
        })
        vi.mocked(adaptM3UPlaylist).mockReturnValue({
          categories: mockCategories,
          channels: mockChannels,
          epgUrl: 'http://example.com/epg.xml',
        })

        const normalizer = new SourceNormalizer(mockM3USource)
        const result = await normalizer.validate()

        expect(result.isValid).toBe(true)
        expect(result.channelCount).toBe(2)
      })

      it('returns invalid when playlist fetch fails', async () => {
        vi.mocked(fetchAndParseM3U).mockRejectedValue(new M3UParseError('Failed to fetch'))

        const normalizer = new SourceNormalizer(mockM3USource)
        const result = await normalizer.validate()

        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Failed to fetch')
      })
    })
  })

  describe('getLiveCategories', () => {
    it('returns categories for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const categories = await normalizer.getLiveCategories()

      expect(categories).toEqual(mockCategories)
      expect(mockClient.getLiveCategories).toHaveBeenCalled()
    })

    it('returns categories for M3U source', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const categories = await normalizer.getLiveCategories()

      expect(categories).toEqual(mockCategories)
    })
  })

  describe('getLiveChannels', () => {
    it('returns all channels for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const channels = await normalizer.getLiveChannels()

      expect(channels).toEqual(mockChannels)
      expect(mockClient.getLiveStreams).toHaveBeenCalledWith(undefined)
    })

    it('returns filtered channels by category for Xtream source', async () => {
      mockClient.getLiveStreams.mockResolvedValue([mockChannels[0]])

      const normalizer = new SourceNormalizer(mockXtreamSource)
      const channels = await normalizer.getLiveChannels('1')

      expect(mockClient.getLiveStreams).toHaveBeenCalledWith('1')
      expect(channels).toHaveLength(1)
    })

    it('returns all channels for M3U source', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const channels = await normalizer.getLiveChannels()

      expect(channels).toEqual(mockChannels)
    })

    it('returns filtered channels by category for M3U source', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const channels = await normalizer.getLiveChannels('1')

      expect(channels).toHaveLength(1)
      expect(channels[0].categoryId).toBe('1')
    })
  })

  describe('getVODCategories', () => {
    it('returns VOD categories for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const categories = await normalizer.getVODCategories()

      expect(categories).toEqual(mockVODCategories)
    })

    it('returns empty array for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      const categories = await normalizer.getVODCategories()

      expect(categories).toEqual([])
    })
  })

  describe('getVODItems', () => {
    it('returns VOD items for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const items = await normalizer.getVODItems()

      expect(items).toEqual(mockVODItems)
    })

    it('returns empty array for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      const items = await normalizer.getVODItems()

      expect(items).toEqual([])
    })
  })

  describe('getSeriesCategories', () => {
    it('returns series categories for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const categories = await normalizer.getSeriesCategories()

      expect(categories).toEqual(mockVODCategories)
    })

    it('returns empty array for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      const categories = await normalizer.getSeriesCategories()

      expect(categories).toEqual([])
    })
  })

  describe('getSeries', () => {
    it('returns series for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const series = await normalizer.getSeries()

      expect(series).toEqual(mockSeries)
    })

    it('returns empty array for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      const series = await normalizer.getSeries()

      expect(series).toEqual([])
    })
  })

  describe('getSeriesInfo', () => {
    it('returns series info for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const info = await normalizer.getSeriesInfo('2001')

      expect(info).toEqual(mockSeriesInfo)
      expect(mockClient.getSeriesInfo).toHaveBeenCalledWith('2001')
    })

    it('throws error for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)

      await expect(normalizer.getSeriesInfo('2001')).rejects.toThrow(SourceNormalizerError)
      await expect(normalizer.getSeriesInfo('2001')).rejects.toThrow(
        'M3U sources do not support series'
      )
    })
  })

  describe('getEPG', () => {
    it('returns EPG data for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const epg = await normalizer.getEPG()

      expect(epg).toBeDefined()
      expect(epg.programs).toBeDefined()
    })

    it('returns empty EPG for M3U source', async () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      const epg = await normalizer.getEPG()

      expect(epg.programs).toEqual({})
      expect(epg.source).toBe('m3u')
    })
  })

  describe('getEPGUrl', () => {
    it('returns undefined for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const url = await normalizer.getEPGUrl()

      expect(url).toBeUndefined()
    })

    it('returns EPG URL from M3U playlist header', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U', epgUrl: 'http://playlist.com/epg.xml' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: [],
        channels: [],
        epgUrl: 'http://playlist.com/epg.xml',
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const url = await normalizer.getEPGUrl()

      expect(url).toBe('http://playlist.com/epg.xml')
    })

    it('returns EPG URL from source config if not in playlist', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: [],
        channels: [],
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const url = await normalizer.getEPGUrl()

      expect(url).toBe('http://example.com/epg.xml')
    })
  })

  describe('getAllContent', () => {
    it('returns all content for Xtream source', async () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      const content = await normalizer.getAllContent()

      expect(content.liveCategories).toEqual(mockCategories)
      expect(content.liveChannels).toEqual(mockChannels)
      expect(content.vodCategories).toEqual(mockVODCategories)
      expect(content.vodItems).toEqual(mockVODItems)
      expect(content.seriesCategories).toEqual(mockVODCategories)
      expect(content.series).toEqual(mockSeries)
    })

    it('returns live content only for M3U source', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
        epgUrl: 'http://example.com/epg.xml',
      })

      const normalizer = new SourceNormalizer(mockM3USource)
      const content = await normalizer.getAllContent()

      expect(content.liveCategories).toEqual(mockCategories)
      expect(content.liveChannels).toEqual(mockChannels)
      expect(content.vodCategories).toEqual([])
      expect(content.vodItems).toEqual([])
      expect(content.seriesCategories).toEqual([])
      expect(content.series).toEqual([])
      expect(content.epgUrl).toBe('http://example.com/epg.xml')
    })
  })

  describe('supportsVOD', () => {
    it('returns true for Xtream source', () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      expect(normalizer.supportsVOD()).toBe(true)
    })

    it('returns false for M3U source', () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      expect(normalizer.supportsVOD()).toBe(false)
    })
  })

  describe('supportsSeries', () => {
    it('returns true for Xtream source', () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      expect(normalizer.supportsSeries()).toBe(true)
    })

    it('returns false for M3U source', () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      expect(normalizer.supportsSeries()).toBe(false)
    })
  })

  describe('hasIntegratedEPG', () => {
    it('returns true for Xtream source', () => {
      const normalizer = new SourceNormalizer(mockXtreamSource)
      expect(normalizer.hasIntegratedEPG()).toBe(true)
    })

    it('returns false for M3U source', () => {
      const normalizer = new SourceNormalizer(mockM3USource)
      expect(normalizer.hasIntegratedEPG()).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('clears the M3U cache', async () => {
      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })
      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        categories: mockCategories,
        channels: mockChannels,
      })

      const normalizer = new SourceNormalizer(mockM3USource)

      // First call - should fetch
      await normalizer.getLiveChannels()
      expect(fetchAndParseM3U).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      await normalizer.getLiveChannels()
      expect(fetchAndParseM3U).toHaveBeenCalledTimes(1)

      // Clear cache
      normalizer.clearCache()

      // Third call - should fetch again
      await normalizer.getLiveChannels()
      expect(fetchAndParseM3U).toHaveBeenCalledTimes(2)
    })
  })

  describe('SourceNormalizerError', () => {
    it('creates error with source type', () => {
      const error = new SourceNormalizerError('Test error', 'xtream')
      expect(error.message).toBe('Test error')
      expect(error.sourceType).toBe('xtream')
      expect(error.name).toBe('SourceNormalizerError')
    })

    it('creates error with cause', () => {
      const cause = new Error('Original error')
      const error = new SourceNormalizerError('Test error', 'm3u', cause)
      expect(error.cause).toBe(cause)
    })
  })
})
