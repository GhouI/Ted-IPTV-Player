/**
 * Tests for Xtream Codes API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { XtreamClient, XtreamApiError, createAuthenticatedClient } from './xtreamClient'
import type { XtreamSource } from '../types/source'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('XtreamClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockAuthResponse = {
    user_info: {
      username: 'testuser',
      password: 'testpass',
      auth: 1,
      status: 'Active',
      exp_date: '1735689600', // 2025-01-01
      is_trial: '0',
      active_cons: '1',
      created_at: '1609459200',
      max_connections: '2',
      allowed_output_formats: ['m3u8', 'ts'],
    },
    server_info: {
      url: 'http://example.com',
      port: '8080',
      https_port: '8443',
      server_protocol: 'http',
      rtmp_port: '1935',
      timezone: 'UTC',
      timestamp_now: 1704067200,
      time_format: '24h',
    },
  }

  describe('constructor', () => {
    it('should create a client with provided config', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      expect(client.getServerUrl()).toBe('http://example.com:8080')
    })

    it('should remove trailing slashes from server URL', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080///',
        username: 'testuser',
        password: 'testpass',
      })

      expect(client.getServerUrl()).toBe('http://example.com:8080')
    })
  })

  describe('fromSource', () => {
    it('should create a client from an XtreamSource', () => {
      const source: XtreamSource = {
        id: '123',
        name: 'Test Source',
        type: 'xtream',
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
        createdAt: Date.now(),
      }

      const client = XtreamClient.fromSource(source)
      expect(client.getServerUrl()).toBe('http://example.com:8080')
    })
  })

  describe('authenticate', () => {
    it('should authenticate successfully and return normalized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const result = await client.authenticate()

      expect(result.userInfo.username).toBe('testuser')
      expect(result.userInfo.status).toBe('Active')
      expect(result.userInfo.isTrial).toBe(false)
      expect(result.userInfo.activeCons).toBe(1)
      expect(result.userInfo.maxConnections).toBe(2)
      expect(result.serverInfo.url).toBe('http://example.com')
      expect(result.serverInfo.port).toBe('8080')
      expect(result.serverInfo.serverProtocol).toBe('http')
    })

    it('should call the correct API URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.pathname).toBe('/player_api.php')
      expect(calledUrl.searchParams.get('username')).toBe('testuser')
      expect(calledUrl.searchParams.get('password')).toBe('testpass')
    })

    it('should throw XtreamApiError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await expect(client.authenticate()).rejects.toThrow('HTTP error 500')
    })

    it('should throw XtreamApiError on authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user_info: { auth: 0 },
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'wrongpass',
      })

      await expect(client.authenticate()).rejects.toThrow('Authentication failed')
    })

    it('should throw XtreamApiError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await expect(client.authenticate()).rejects.toThrow(XtreamApiError)
      await expect(client.authenticate()).rejects.toThrow('Request failed')
    })

    it('should handle timeout', async () => {
      vi.useFakeTimers()

      const abortError = new Error('Abort')
      abortError.name = 'AbortError'

      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100)
        })
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
        timeout: 50,
      })

      const authPromise = client.authenticate()
      vi.advanceTimersByTime(100)

      await expect(authPromise).rejects.toThrow('timeout')
    })
  })

  describe('getAuthResponse', () => {
    it('should return null before authentication', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      expect(client.getAuthResponse()).toBeNull()
    })

    it('should return auth response after authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      expect(client.getAuthResponse()).not.toBeNull()
      expect(client.getAuthResponse()?.userInfo.username).toBe('testuser')
    })
  })

  describe('isAccountActive', () => {
    it('should return false before authentication', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      expect(client.isAccountActive()).toBe(false)
    })

    it('should return true for active account with future expiration', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days from now
      const response = {
        ...mockAuthResponse,
        user_info: {
          ...mockAuthResponse.user_info,
          status: 'Active',
          exp_date: futureTimestamp.toString(),
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      expect(client.isAccountActive()).toBe(true)
    })

    it('should return false for expired account', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400 // Yesterday
      const response = {
        ...mockAuthResponse,
        user_info: {
          ...mockAuthResponse.user_info,
          status: 'Active',
          exp_date: pastTimestamp.toString(),
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      expect(client.isAccountActive()).toBe(false)
    })

    it('should return false for disabled account', async () => {
      const response = {
        ...mockAuthResponse,
        user_info: {
          ...mockAuthResponse.user_info,
          status: 'Disabled',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      expect(client.isAccountActive()).toBe(false)
    })
  })

  describe('getExpirationDate', () => {
    it('should return null before authentication', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      expect(client.getExpirationDate()).toBeNull()
    })

    it('should return Date object for valid expiration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      const expDate = client.getExpirationDate()
      expect(expDate).toBeInstanceOf(Date)
    })

    it('should return null for null expiration date', async () => {
      const response = {
        ...mockAuthResponse,
        user_info: {
          ...mockAuthResponse.user_info,
          exp_date: null,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.authenticate()
      expect(client.getExpirationDate()).toBeNull()
    })
  })

  describe('getLiveCategories', () => {
    const mockCategoriesResponse = [
      { category_id: '1', category_name: 'News', parent_id: 0 },
      { category_id: '2', category_name: 'Sports', parent_id: 0 },
      { category_id: '3', category_name: 'Football', parent_id: 2 },
    ]

    it('should fetch and normalize live categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategoriesResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getLiveCategories()

      expect(categories).toHaveLength(3)
      expect(categories[0]).toEqual({
        id: '1',
        name: 'News',
        parentId: '0',
      })
      expect(categories[1]).toEqual({
        id: '2',
        name: 'Sports',
        parentId: '0',
      })
      expect(categories[2]).toEqual({
        id: '3',
        name: 'Football',
        parentId: '2',
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getLiveCategories()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_live_categories')
    })

    it('should handle empty category list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getLiveCategories()
      expect(categories).toEqual([])
    })

    it('should handle categories without parent_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ category_id: '1', category_name: 'General' }]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getLiveCategories()
      expect(categories[0].parentId).toBeUndefined()
    })
  })

  describe('getLiveStreams', () => {
    const mockStreamsResponse = [
      {
        num: 1,
        name: 'CNN',
        stream_type: 'live',
        stream_id: 101,
        stream_icon: 'http://example.com/cnn.png',
        epg_channel_id: 'cnn.us',
        added: '1609459200',
        is_adult: '0',
        category_id: '1',
        custom_sid: '',
        tv_archive: 0,
        direct_source: '',
        tv_archive_duration: 0,
      },
      {
        num: 2,
        name: 'ESPN',
        stream_type: 'live',
        stream_id: 102,
        stream_icon: '',
        epg_channel_id: null,
        added: '1609459200',
        is_adult: '0',
        category_id: '2',
        custom_sid: '',
        tv_archive: 0,
        direct_source: '',
        tv_archive_duration: 0,
      },
    ]

    it('should fetch and normalize live streams', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStreamsResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const streams = await client.getLiveStreams()

      expect(streams).toHaveLength(2)
      expect(streams[0]).toEqual({
        id: '101',
        name: 'CNN',
        number: 1,
        logo: 'http://example.com/cnn.png',
        categoryId: '1',
        streamUrl: 'http://example.com:8080/live/testuser/testpass/101.ts',
        streamType: 'live',
        epgChannelId: 'cnn.us',
        isAvailable: true,
      })
      expect(streams[1]).toEqual({
        id: '102',
        name: 'ESPN',
        number: 2,
        logo: undefined,
        categoryId: '2',
        streamUrl: 'http://example.com:8080/live/testuser/testpass/102.ts',
        streamType: 'live',
        epgChannelId: undefined,
        isAvailable: true,
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getLiveStreams()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_live_streams')
      expect(calledUrl.searchParams.has('category_id')).toBe(false)
    })

    it('should filter by category when categoryId is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getLiveStreams('5')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('category_id')).toBe('5')
    })

    it('should handle empty stream list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const streams = await client.getLiveStreams()
      expect(streams).toEqual([])
    })
  })

  describe('getLiveStreamsByCategory', () => {
    it('should call getLiveStreams with category ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getLiveStreamsByCategory('3')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_live_streams')
      expect(calledUrl.searchParams.get('category_id')).toBe('3')
    })
  })

  describe('buildStreamUrl', () => {
    it('should build live stream URL with default ts format', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const url = client.buildStreamUrl(123, 'live')
      expect(url).toBe('http://example.com:8080/live/testuser/testpass/123.ts')
    })

    it('should build movie stream URL with default m3u8 format', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const url = client.buildStreamUrl(456, 'movie')
      expect(url).toBe('http://example.com:8080/movie/testuser/testpass/456.m3u8')
    })

    it('should build series stream URL', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const url = client.buildStreamUrl(789, 'series')
      expect(url).toBe('http://example.com:8080/series/testuser/testpass/789.m3u8')
    })

    it('should use custom format when provided', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const url = client.buildStreamUrl(123, 'live', 'm3u8')
      expect(url).toBe('http://example.com:8080/live/testuser/testpass/123.m3u8')
    })

    it('should handle string stream IDs', () => {
      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const url = client.buildStreamUrl('abc123', 'live')
      expect(url).toBe('http://example.com:8080/live/testuser/testpass/abc123.ts')
    })
  })
})

describe('createAuthenticatedClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should create and authenticate a client', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user_info: {
            username: 'testuser',
            auth: 1,
            status: 'Active',
            exp_date: null,
            is_trial: '0',
            active_cons: '0',
            created_at: Date.now(),
            max_connections: '1',
            allowed_output_formats: ['ts'],
          },
          server_info: {
            url: 'http://example.com',
            port: '8080',
            server_protocol: 'http',
            timezone: 'UTC',
            timestamp_now: Date.now() / 1000,
          },
        }),
    })

    const client = await createAuthenticatedClient({
      serverUrl: 'http://example.com:8080',
      username: 'testuser',
      password: 'testpass',
    })

    expect(client).toBeInstanceOf(XtreamClient)
    expect(client.getAuthResponse()).not.toBeNull()
  })

  it('should throw if authentication fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user_info: { auth: 0 },
        }),
    })

    await expect(
      createAuthenticatedClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'wrongpass',
      })
    ).rejects.toThrow(XtreamApiError)
  })
})

describe('XtreamApiError', () => {
  it('should include status code and response', () => {
    const error = new XtreamApiError('Test error', 404, { message: 'Not found' })
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(404)
    expect(error.response).toEqual({ message: 'Not found' })
    expect(error.name).toBe('XtreamApiError')
  })
})

describe('XtreamClient VOD methods', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getVODCategories', () => {
    const mockVODCategoriesResponse = [
      { category_id: '10', category_name: 'Action', parent_id: 0 },
      { category_id: '11', category_name: 'Comedy', parent_id: 0 },
      { category_id: '12', category_name: 'Thriller', parent_id: 10 },
    ]

    it('should fetch and normalize VOD categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVODCategoriesResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getVODCategories()

      expect(categories).toHaveLength(3)
      expect(categories[0]).toEqual({
        id: '10',
        name: 'Action',
        parentId: '0',
      })
      expect(categories[1]).toEqual({
        id: '11',
        name: 'Comedy',
        parentId: '0',
      })
      expect(categories[2]).toEqual({
        id: '12',
        name: 'Thriller',
        parentId: '10',
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getVODCategories()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_vod_categories')
    })

    it('should handle empty category list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getVODCategories()
      expect(categories).toEqual([])
    })

    it('should handle categories without parent_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ category_id: '10', category_name: 'Movies' }]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getVODCategories()
      expect(categories[0].parentId).toBeUndefined()
    })
  })

  describe('getVODStreams', () => {
    const mockVODStreamsResponse = [
      {
        num: 1,
        name: 'The Matrix',
        stream_type: 'movie',
        stream_id: 1001,
        stream_icon: 'http://example.com/matrix.jpg',
        rating: 'R',
        rating_5based: 4.5,
        added: '1609459200',
        is_adult: '0',
        category_id: '10',
        container_extension: 'mkv',
        custom_sid: '',
        direct_source: '',
      },
      {
        num: 2,
        name: 'Inception',
        stream_type: 'movie',
        stream_id: 1002,
        stream_icon: '',
        rating: '',
        rating_5based: 0,
        added: '1609459200',
        is_adult: '0',
        category_id: '10',
        container_extension: 'mp4',
        custom_sid: '',
        direct_source: '',
      },
    ]

    it('should fetch and normalize VOD streams', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVODStreamsResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const streams = await client.getVODStreams()

      expect(streams).toHaveLength(2)
      expect(streams[0]).toEqual({
        id: '1001',
        title: 'The Matrix',
        categoryId: '10',
        streamUrl: 'http://example.com:8080/movie/testuser/testpass/1001.mkv',
        streamType: 'vod',
        poster: 'http://example.com/matrix.jpg',
        rating: 'R',
        score: 4.5,
        containerFormat: 'mkv',
        dateAdded: '1609459200',
      })
      expect(streams[1]).toEqual({
        id: '1002',
        title: 'Inception',
        categoryId: '10',
        streamUrl: 'http://example.com:8080/movie/testuser/testpass/1002.mp4',
        streamType: 'vod',
        poster: undefined,
        rating: undefined,
        score: undefined,
        containerFormat: 'mp4',
        dateAdded: '1609459200',
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getVODStreams()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_vod_streams')
      expect(calledUrl.searchParams.has('category_id')).toBe(false)
    })

    it('should filter by category when categoryId is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getVODStreams('10')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('category_id')).toBe('10')
    })

    it('should handle empty stream list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const streams = await client.getVODStreams()
      expect(streams).toEqual([])
    })

    it('should use m3u8 extension when container_extension is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              num: 1,
              name: 'Test Movie',
              stream_type: 'movie',
              stream_id: 2001,
              stream_icon: '',
              rating: '',
              rating_5based: 0,
              added: '',
              is_adult: '0',
              category_id: '10',
              container_extension: '',
              custom_sid: '',
              direct_source: '',
            },
          ]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const streams = await client.getVODStreams()
      expect(streams[0].streamUrl).toBe(
        'http://example.com:8080/movie/testuser/testpass/2001.m3u8'
      )
    })
  })

  describe('getVODStreamsByCategory', () => {
    it('should call getVODStreams with category ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getVODStreamsByCategory('10')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_vod_streams')
      expect(calledUrl.searchParams.get('category_id')).toBe('10')
    })
  })
})

describe('XtreamClient Series methods', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getSeriesCategories', () => {
    const mockSeriesCategoriesResponse = [
      { category_id: '20', category_name: 'Drama', parent_id: 0 },
      { category_id: '21', category_name: 'Sci-Fi', parent_id: 0 },
      { category_id: '22', category_name: 'Crime Drama', parent_id: 20 },
    ]

    it('should fetch and normalize series categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSeriesCategoriesResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getSeriesCategories()

      expect(categories).toHaveLength(3)
      expect(categories[0]).toEqual({
        id: '20',
        name: 'Drama',
        parentId: '0',
      })
      expect(categories[1]).toEqual({
        id: '21',
        name: 'Sci-Fi',
        parentId: '0',
      })
      expect(categories[2]).toEqual({
        id: '22',
        name: 'Crime Drama',
        parentId: '20',
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getSeriesCategories()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_series_categories')
    })

    it('should handle empty category list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getSeriesCategories()
      expect(categories).toEqual([])
    })

    it('should handle categories without parent_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ category_id: '20', category_name: 'Series' }]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const categories = await client.getSeriesCategories()
      expect(categories[0].parentId).toBeUndefined()
    })
  })

  describe('getSeries', () => {
    const mockSeriesResponse = [
      {
        num: 1,
        name: 'Breaking Bad',
        series_id: 5001,
        cover: 'http://example.com/bb.jpg',
        plot: 'A high school chemistry teacher turned meth manufacturer.',
        cast: 'Bryan Cranston, Aaron Paul, Anna Gunn',
        director: 'Vince Gilligan',
        genre: 'Drama, Crime, Thriller',
        releaseDate: '2008-01-20',
        last_modified: '1609459200',
        rating: 'TV-MA',
        rating_5based: 4.9,
        backdrop_path: ['http://example.com/bb_backdrop.jpg'],
        youtube_trailer: 'HhesaQXLuRY',
        episode_run_time: '45',
        category_id: '20',
      },
      {
        num: 2,
        name: 'The Office',
        series_id: 5002,
        cover: '',
        plot: '',
        cast: '',
        director: '',
        genre: '',
        releaseDate: '',
        last_modified: '',
        rating: '',
        rating_5based: 0,
        category_id: '21',
      },
    ]

    it('should fetch and normalize series', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSeriesResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const series = await client.getSeries()

      expect(series).toHaveLength(2)
      expect(series[0]).toEqual({
        id: '5001',
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned meth manufacturer.',
        categoryId: '20',
        poster: 'http://example.com/bb.jpg',
        backdrop: 'http://example.com/bb_backdrop.jpg',
        year: 2008,
        genres: ['Drama', 'Crime', 'Thriller'],
        cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'],
        rating: 'TV-MA',
        score: 4.9,
        lastUpdated: '1609459200',
      })
      expect(series[1]).toEqual({
        id: '5002',
        title: 'The Office',
        description: undefined,
        categoryId: '21',
        poster: undefined,
        backdrop: undefined,
        year: undefined,
        genres: undefined,
        cast: undefined,
        rating: undefined,
        score: undefined,
        lastUpdated: undefined,
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getSeries()

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_series')
      expect(calledUrl.searchParams.has('category_id')).toBe(false)
    })

    it('should filter by category when categoryId is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getSeries('20')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('category_id')).toBe('20')
    })

    it('should handle empty series list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const series = await client.getSeries()
      expect(series).toEqual([])
    })
  })

  describe('getSeriesByCategory', () => {
    it('should call getSeries with category ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getSeriesByCategory('20')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_series')
      expect(calledUrl.searchParams.get('category_id')).toBe('20')
    })
  })

  describe('getSeriesInfo', () => {
    const mockSeriesInfoResponse = {
      seasons: [
        {
          air_date: '2008-01-20',
          episode_count: 7,
          id: 101,
          name: 'Season 1',
          overview: 'The first season of Breaking Bad.',
          season_number: 1,
          cover: 'http://example.com/s1.jpg',
          cover_big: 'http://example.com/s1_big.jpg',
        },
        {
          air_date: '2009-03-08',
          episode_count: 13,
          id: 102,
          name: 'Season 2',
          overview: 'The second season.',
          season_number: 2,
          cover: 'http://example.com/s2.jpg',
        },
      ],
      info: {
        name: 'Breaking Bad',
        cover: 'http://example.com/bb.jpg',
        plot: 'A high school chemistry teacher turned meth manufacturer.',
        cast: 'Bryan Cranston, Aaron Paul',
        director: 'Vince Gilligan',
        genre: 'Drama, Crime',
        releaseDate: '2008-01-20',
        last_modified: '1609459200',
        rating: 'TV-MA',
        rating_5based: 4.9,
        backdrop_path: ['http://example.com/bb_backdrop.jpg'],
        youtube_trailer: 'HhesaQXLuRY',
        episode_run_time: '45',
        category_id: '20',
      },
      episodes: {
        '1': [
          {
            id: '10001',
            episode_num: 1,
            title: 'Pilot',
            container_extension: 'mkv',
            info: {
              movie_image: 'http://example.com/ep1.jpg',
              plot: 'Walter White begins his journey.',
              releasedate: '2008-01-20',
              rating: 'TV-MA',
              duration_secs: 3480,
              duration: '00:58:00',
              video: { codec_name: 'h264' },
              audio: { codec_name: 'aac' },
            },
            custom_sid: '',
            added: '1609459200',
            season: 1,
            direct_source: '',
          },
          {
            id: '10002',
            episode_num: 2,
            title: "Cat's in the Bag...",
            container_extension: 'mkv',
            info: {
              plot: 'Walt and Jesse try to dispose of a body.',
            },
            custom_sid: '',
            added: '1609459200',
            season: 1,
            direct_source: '',
          },
        ],
        '2': [
          {
            id: '10003',
            episode_num: 1,
            title: 'Seven Thirty-Seven',
            container_extension: 'mp4',
            info: {},
            custom_sid: '',
            added: '1609459200',
            season: 2,
            direct_source: '',
          },
        ],
      },
    }

    it('should fetch and normalize series info with seasons and episodes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSeriesInfoResponse),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const seriesInfo = await client.getSeriesInfo('5001')

      // Check series
      expect(seriesInfo.series).toEqual({
        id: '5001',
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned meth manufacturer.',
        categoryId: '20',
        poster: 'http://example.com/bb.jpg',
        backdrop: 'http://example.com/bb_backdrop.jpg',
        year: 2008,
        genres: ['Drama', 'Crime'],
        cast: ['Bryan Cranston', 'Aaron Paul'],
        rating: 'TV-MA',
        score: 4.9,
        seasonCount: 2,
        episodeCount: 3,
        lastUpdated: '1609459200',
      })

      // Check seasons
      expect(seriesInfo.seasons).toHaveLength(2)
      expect(seriesInfo.seasons[0]).toEqual({
        id: '101',
        seriesId: '5001',
        seasonNumber: 1,
        name: 'Season 1',
        description: 'The first season of Breaking Bad.',
        poster: 'http://example.com/s1_big.jpg',
        airDate: '2008-01-20',
        episodeCount: 7,
      })
      expect(seriesInfo.seasons[1]).toEqual({
        id: '102',
        seriesId: '5001',
        seasonNumber: 2,
        name: 'Season 2',
        description: 'The second season.',
        poster: 'http://example.com/s2.jpg',
        airDate: '2009-03-08',
        episodeCount: 13,
      })

      // Check episodes
      expect(Object.keys(seriesInfo.episodes)).toHaveLength(2)
      expect(seriesInfo.episodes['101']).toHaveLength(2)
      expect(seriesInfo.episodes['102']).toHaveLength(1)

      // Check first episode details
      expect(seriesInfo.episodes['101'][0]).toEqual({
        id: '10001',
        seriesId: '5001',
        seasonId: '101',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Pilot',
        description: 'Walter White begins his journey.',
        streamUrl: 'http://example.com:8080/series/testuser/testpass/10001.mkv',
        streamType: 'vod',
        thumbnail: 'http://example.com/ep1.jpg',
        duration: 3480,
        airDate: '2008-01-20',
        rating: 'TV-MA',
        containerFormat: 'mkv',
        videoCodec: 'h264',
        audioCodec: 'aac',
      })

      // Check episode with minimal info
      expect(seriesInfo.episodes['101'][1]).toEqual({
        id: '10002',
        seriesId: '5001',
        seasonId: '101',
        seasonNumber: 1,
        episodeNumber: 2,
        title: "Cat's in the Bag...",
        description: 'Walt and Jesse try to dispose of a body.',
        streamUrl: 'http://example.com:8080/series/testuser/testpass/10002.mkv',
        streamType: 'vod',
        thumbnail: undefined,
        duration: undefined,
        airDate: undefined,
        rating: undefined,
        containerFormat: 'mkv',
        videoCodec: undefined,
        audioCodec: undefined,
      })
    })

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            seasons: [],
            info: {
              name: 'Test',
              cover: '',
              plot: '',
              cast: '',
              director: '',
              genre: '',
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 0,
              category_id: '1',
            },
            episodes: {},
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      await client.getSeriesInfo('5001')

      const calledUrl = new URL(mockFetch.mock.calls[0][0])
      expect(calledUrl.searchParams.get('action')).toBe('get_series_info')
      expect(calledUrl.searchParams.get('series_id')).toBe('5001')
    })

    it('should handle series with no seasons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            seasons: [],
            info: {
              name: 'Empty Series',
              cover: '',
              plot: '',
              cast: '',
              director: '',
              genre: '',
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 0,
              category_id: '1',
            },
            episodes: {},
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const seriesInfo = await client.getSeriesInfo('9999')

      expect(seriesInfo.series.title).toBe('Empty Series')
      expect(seriesInfo.seasons).toEqual([])
      expect(seriesInfo.episodes).toEqual({})
      expect(seriesInfo.series.seasonCount).toBe(0)
      expect(seriesInfo.series.episodeCount).toBe(0)
    })

    it('should handle episodes with missing container_extension', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            seasons: [
              {
                air_date: '',
                episode_count: 1,
                id: 1,
                name: 'Season 1',
                overview: '',
                season_number: 1,
              },
            ],
            info: {
              name: 'Test',
              cover: '',
              plot: '',
              cast: '',
              director: '',
              genre: '',
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 0,
              category_id: '1',
            },
            episodes: {
              '1': [
                {
                  id: '1001',
                  episode_num: 1,
                  title: 'Episode 1',
                  container_extension: '',
                  info: {},
                  custom_sid: '',
                  added: '',
                  season: 1,
                  direct_source: '',
                },
              ],
            },
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const seriesInfo = await client.getSeriesInfo('1')
      expect(seriesInfo.episodes['1'][0].streamUrl).toBe(
        'http://example.com:8080/series/testuser/testpass/1001.m3u8'
      )
    })

    it('should use default episode title when missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            seasons: [
              {
                air_date: '',
                episode_count: 1,
                id: 1,
                name: 'Season 1',
                overview: '',
                season_number: 1,
              },
            ],
            info: {
              name: 'Test',
              cover: '',
              plot: '',
              cast: '',
              director: '',
              genre: '',
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 0,
              category_id: '1',
            },
            episodes: {
              '1': [
                {
                  id: '1001',
                  episode_num: 5,
                  title: '',
                  container_extension: 'mkv',
                  info: {},
                  custom_sid: '',
                  added: '',
                  season: 1,
                  direct_source: '',
                },
              ],
            },
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const seriesInfo = await client.getSeriesInfo('1')
      expect(seriesInfo.episodes['1'][0].title).toBe('Episode 5')
    })

    it('should use default season name when missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            seasons: [
              {
                air_date: '',
                episode_count: 1,
                id: 1,
                name: '',
                overview: '',
                season_number: 3,
              },
            ],
            info: {
              name: 'Test',
              cover: '',
              plot: '',
              cast: '',
              director: '',
              genre: '',
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 0,
              category_id: '1',
            },
            episodes: {},
          }),
      })

      const client = new XtreamClient({
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
      })

      const seriesInfo = await client.getSeriesInfo('1')
      expect(seriesInfo.seasons[0].name).toBe('Season 3')
    })
  })
})
