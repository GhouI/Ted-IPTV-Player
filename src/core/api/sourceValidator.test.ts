/**
 * Tests for sourceValidator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateXtreamSource,
  validateM3USource,
  validateSource,
  isXtreamValidationResult,
  isM3UValidationResult,
  formatValidationSuccess,
} from './sourceValidator'
import type { XtreamSourceInput, M3USourceInput } from '../types/source'

// Mock the XtreamClient
vi.mock('./xtreamClient', () => ({
  XtreamClient: vi.fn().mockImplementation((config) => ({
    authenticate: vi.fn(),
    isAccountActive: vi.fn(),
    getExpirationDate: vi.fn(),
    getLiveStreams: vi.fn(),
    getVODStreams: vi.fn(),
    getSeries: vi.fn(),
    config,
  })),
  XtreamApiError: class XtreamApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown
    ) {
      super(message)
      this.name = 'XtreamApiError'
    }
  },
}))

// Mock the M3U parser
vi.mock('./m3uParser', () => ({
  fetchAndParseM3U: vi.fn(),
  M3UParseError: class M3UParseError extends Error {
    constructor(
      message: string,
      public cause?: unknown
    ) {
      super(message)
      this.name = 'M3UParseError'
    }
  },
}))

// Mock the M3U adapter
vi.mock('./m3uAdapter', () => ({
  adaptM3UPlaylist: vi.fn(),
}))

describe('sourceValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateXtreamSource', () => {
    const validInput: XtreamSourceInput = {
      name: 'Test Provider',
      serverUrl: 'http://example.com:8080',
      username: 'testuser',
      password: 'testpass',
    }

    it('should return error for empty server URL', async () => {
      const result = await validateXtreamSource({ ...validInput, serverUrl: '' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Server URL is required')
    })

    it('should return error for empty username', async () => {
      const result = await validateXtreamSource({ ...validInput, username: '' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Username is required')
    })

    it('should return error for empty password', async () => {
      const result = await validateXtreamSource({ ...validInput, password: '' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Password is required')
    })

    it('should return error for invalid URL format', async () => {
      const result = await validateXtreamSource({ ...validInput, serverUrl: 'not-a-url' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid server URL format')
    })

    it('should successfully validate with active account', async () => {
      const { XtreamClient } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockResolvedValue({
          userInfo: { status: 'Active', expDate: null },
          serverInfo: { url: 'example.com' },
        }),
        isAccountActive: vi.fn().mockReturnValue(true),
        getExpirationDate: vi.fn().mockReturnValue(null),
        getLiveStreams: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
        getVODStreams: vi.fn().mockResolvedValue([{ id: '1' }]),
        getSeries: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(true)
      expect(result.authResponse).toBeDefined()
      expect(result.channelCount).toBe(2)
      expect(result.vodCount).toBe(1)
      expect(result.seriesCount).toBe(0)
    })

    it('should return error for inactive account', async () => {
      const { XtreamClient } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockResolvedValue({
          userInfo: { status: 'Disabled', expDate: null },
          serverInfo: { url: 'example.com' },
        }),
        isAccountActive: vi.fn().mockReturnValue(false),
        getExpirationDate: vi.fn().mockReturnValue(null),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Disabled')
    })

    it('should return error for expired account', async () => {
      const { XtreamClient } = await import('./xtreamClient')
      const expiredDate = new Date('2020-01-01')
      const mockClient = {
        authenticate: vi.fn().mockResolvedValue({
          userInfo: { status: 'Active', expDate: '1577836800' },
          serverInfo: { url: 'example.com' },
        }),
        isAccountActive: vi.fn().mockReturnValue(false),
        getExpirationDate: vi.fn().mockReturnValue(expiredDate),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should handle authentication error', async () => {
      const { XtreamClient, XtreamApiError } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockRejectedValue(
          new XtreamApiError('Authentication failed: Invalid credentials')
        ),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid username or password')
    })

    it('should handle timeout error', async () => {
      const { XtreamClient, XtreamApiError } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockRejectedValue(
          new XtreamApiError('Request timeout after 15000ms')
        ),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('timed out')
    })

    it('should handle 404 error', async () => {
      const { XtreamClient, XtreamApiError } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockRejectedValue(new XtreamApiError('Not found', 404)),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should continue validation even if content count fetch fails', async () => {
      const { XtreamClient } = await import('./xtreamClient')
      const mockClient = {
        authenticate: vi.fn().mockResolvedValue({
          userInfo: { status: 'Active', expDate: null },
          serverInfo: { url: 'example.com' },
        }),
        isAccountActive: vi.fn().mockReturnValue(true),
        getExpirationDate: vi.fn().mockReturnValue(null),
        getLiveStreams: vi.fn().mockRejectedValue(new Error('Failed')),
        getVODStreams: vi.fn().mockRejectedValue(new Error('Failed')),
        getSeries: vi.fn().mockRejectedValue(new Error('Failed')),
      }
      vi.mocked(XtreamClient).mockImplementation(() => mockClient as never)

      const result = await validateXtreamSource(validInput)

      // Validation should succeed even if content counts couldn't be fetched
      // Counts will be 0 because the catch returns empty arrays
      expect(result.isValid).toBe(true)
      expect(result.channelCount).toBe(0)
      expect(result.vodCount).toBe(0)
      expect(result.seriesCount).toBe(0)
    })
  })

  describe('validateM3USource', () => {
    const validInput: M3USourceInput = {
      name: 'Test Playlist',
      playlistUrl: 'http://example.com/playlist.m3u',
    }

    it('should return error for empty playlist URL', async () => {
      const result = await validateM3USource({ ...validInput, playlistUrl: '' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Playlist URL is required')
    })

    it('should return error for invalid URL format', async () => {
      const result = await validateM3USource({ ...validInput, playlistUrl: 'not-a-url' })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid playlist URL format')
    })

    it('should return error for invalid EPG URL format', async () => {
      const result = await validateM3USource({
        ...validInput,
        epgUrl: 'not-a-url',
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid EPG URL format')
    })

    it('should successfully validate a valid playlist', async () => {
      const { fetchAndParseM3U } = await import('./m3uParser')
      const { adaptM3UPlaylist } = await import('./m3uAdapter')

      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U', epgUrl: 'http://example.com/epg.xml' },
        items: [
          { name: 'Channel 1', url: 'http://stream1', lineNumber: 1, raw: '' },
          { name: 'Channel 2', url: 'http://stream2', lineNumber: 2, raw: '' },
        ],
      })

      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        channels: [
          { id: '1', name: 'Channel 1', streamUrl: 'http://stream1', streamType: 'live', categoryId: '1', isAvailable: true },
          { id: '2', name: 'Channel 2', streamUrl: 'http://stream2', streamType: 'live', categoryId: '1', isAvailable: true },
        ],
        categories: [{ id: '1', name: 'General' }],
        epgUrl: 'http://example.com/epg.xml',
      })

      const result = await validateM3USource(validInput)

      expect(result.isValid).toBe(true)
      expect(result.channelCount).toBe(2)
      expect(result.categoryCount).toBe(1)
      expect(result.epgUrl).toBe('http://example.com/epg.xml')
    })

    it('should return error for empty playlist', async () => {
      const { fetchAndParseM3U } = await import('./m3uParser')

      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [],
      })

      const result = await validateM3USource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('should handle timeout error', async () => {
      const { fetchAndParseM3U, M3UParseError } = await import('./m3uParser')

      vi.mocked(fetchAndParseM3U).mockRejectedValue(
        new M3UParseError('Request timeout after 15000ms')
      )

      const result = await validateM3USource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('timed out')
    })

    it('should handle 404 error', async () => {
      const { fetchAndParseM3U, M3UParseError } = await import('./m3uParser')

      vi.mocked(fetchAndParseM3U).mockRejectedValue(new M3UParseError('HTTP 404 Not Found'))

      const result = await validateM3USource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should handle invalid M3U format error', async () => {
      const { fetchAndParseM3U, M3UParseError } = await import('./m3uParser')

      vi.mocked(fetchAndParseM3U).mockRejectedValue(
        new M3UParseError('Invalid M3U format: content must start with #EXTM3U')
      )

      const result = await validateM3USource(validInput)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid playlist format')
    })

    it('should use EPG URL from input if not in playlist', async () => {
      const { fetchAndParseM3U } = await import('./m3uParser')
      const { adaptM3UPlaylist } = await import('./m3uAdapter')

      vi.mocked(fetchAndParseM3U).mockResolvedValue({
        header: { raw: '#EXTM3U' },
        items: [{ name: 'Channel 1', url: 'http://stream1', lineNumber: 1, raw: '' }],
      })

      vi.mocked(adaptM3UPlaylist).mockReturnValue({
        channels: [{ id: '1', name: 'Channel 1', streamUrl: 'http://stream1', streamType: 'live', categoryId: '1', isAvailable: true }],
        categories: [{ id: '1', name: 'General' }],
      })

      const result = await validateM3USource({
        ...validInput,
        epgUrl: 'http://example.com/my-epg.xml',
      })

      expect(result.isValid).toBe(true)
      expect(result.epgUrl).toBe('http://example.com/my-epg.xml')
    })
  })

  describe('validateSource', () => {
    it('should call validateXtreamSource for xtream type', async () => {
      const result = await validateSource('xtream', {
        name: 'Test',
        serverUrl: '',
        username: 'user',
        password: 'pass',
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Server URL is required')
    })

    it('should call validateM3USource for m3u type', async () => {
      const result = await validateSource('m3u', {
        name: 'Test',
        playlistUrl: '',
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Playlist URL is required')
    })

    it('should return error for unknown source type', async () => {
      const result = await validateSource('unknown' as never, {
        name: 'Test',
        playlistUrl: 'http://example.com',
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Unknown source type')
    })
  })

  describe('type guards', () => {
    it('isXtreamValidationResult should correctly identify Xtream results', () => {
      const xtreamResult = {
        isValid: true,
        authResponse: { userInfo: {}, serverInfo: {} },
        channelCount: 10,
        vodCount: 5,
        seriesCount: 2,
      }

      const m3uResult = {
        isValid: true,
        channelCount: 10,
        categoryCount: 3,
      }

      expect(isXtreamValidationResult(xtreamResult as never)).toBe(true)
      expect(isXtreamValidationResult(m3uResult as never)).toBe(false)
    })

    it('isM3UValidationResult should correctly identify M3U results', () => {
      const xtreamResult = {
        isValid: true,
        authResponse: { userInfo: {}, serverInfo: {} },
        channelCount: 10,
      }

      const m3uResult = {
        isValid: true,
        channelCount: 10,
        categoryCount: 3,
      }

      expect(isM3UValidationResult(m3uResult as never)).toBe(true)
      expect(isM3UValidationResult(xtreamResult as never)).toBe(false)
    })
  })

  describe('formatValidationSuccess', () => {
    it('should return empty string for invalid result', () => {
      const result = formatValidationSuccess({ isValid: false, error: 'Failed' })

      expect(result).toBe('')
    })

    it('should format Xtream validation success correctly', () => {
      const result = formatValidationSuccess({
        isValid: true,
        channelCount: 100,
        vodCount: 50,
        seriesCount: 25,
      })

      expect(result).toContain('100 channels')
      expect(result).toContain('50 movies')
      expect(result).toContain('25 series')
    })

    it('should handle singular counts correctly', () => {
      const result = formatValidationSuccess({
        isValid: true,
        channelCount: 1,
        vodCount: 1,
        seriesCount: 1,
        categoryCount: 1,
      })

      expect(result).toContain('1 channel')
      expect(result).toContain('1 movie')
      expect(result).toContain('1 series')
    })

    it('should format M3U validation success correctly', () => {
      const result = formatValidationSuccess({
        isValid: true,
        channelCount: 50,
        categoryCount: 5,
      })

      expect(result).toContain('50 channels')
      expect(result).toContain('5 categories')
    })

    it('should return default message when no counts available', () => {
      const result = formatValidationSuccess({ isValid: true })

      expect(result).toBe('Connection successful')
    })

    it('should skip zero counts for VOD and series', () => {
      const result = formatValidationSuccess({
        isValid: true,
        channelCount: 100,
        vodCount: 0,
        seriesCount: 0,
      })

      expect(result).toContain('100 channels')
      expect(result).not.toContain('movie')
      expect(result).not.toContain('series')
    })
  })
})
