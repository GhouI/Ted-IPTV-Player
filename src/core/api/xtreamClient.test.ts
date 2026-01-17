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
