import { describe, it, expect } from 'vitest'
import {
  isXtreamSource,
  isM3USource,
  type Source,
  type XtreamSource,
  type M3USource,
  type XtreamServerInfo,
  type XtreamUserInfo,
  type XtreamAuthResponse,
  type SourceValidationResult,
  type XtreamSourceInput,
  type M3USourceInput,
  type SourceInput,
} from './source'

describe('Source types', () => {
  describe('XtreamSource', () => {
    it('should define all required fields', () => {
      const source: XtreamSource = {
        id: 'xtream-1',
        name: 'My Xtream Provider',
        type: 'xtream',
        serverUrl: 'http://example.com:8080',
        username: 'testuser',
        password: 'testpass',
        createdAt: Date.now(),
      }

      expect(source.id).toBe('xtream-1')
      expect(source.name).toBe('My Xtream Provider')
      expect(source.type).toBe('xtream')
      expect(source.serverUrl).toBe('http://example.com:8080')
      expect(source.username).toBe('testuser')
      expect(source.password).toBe('testpass')
      expect(source.createdAt).toBeDefined()
    })

    it('should support optional fields', () => {
      const source: XtreamSource = {
        id: 'xtream-2',
        name: 'Active Source',
        type: 'xtream',
        serverUrl: 'http://provider.com:25461',
        username: 'user',
        password: 'pass',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-15T12:00:00Z',
      }

      expect(source.isActive).toBe(true)
      expect(source.lastUsedAt).toBe('2024-01-15T12:00:00Z')
    })
  })

  describe('M3USource', () => {
    it('should define all required fields', () => {
      const source: M3USource = {
        id: 'm3u-1',
        name: 'My M3U Playlist',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        createdAt: Date.now(),
      }

      expect(source.id).toBe('m3u-1')
      expect(source.name).toBe('My M3U Playlist')
      expect(source.type).toBe('m3u')
      expect(source.playlistUrl).toBe('http://example.com/playlist.m3u')
      expect(source.createdAt).toBeDefined()
    })

    it('should support optional EPG URL', () => {
      const source: M3USource = {
        id: 'm3u-2',
        name: 'M3U with EPG',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        epgUrl: 'http://example.com/epg.xml',
        createdAt: Date.now(),
      }

      expect(source.epgUrl).toBe('http://example.com/epg.xml')
    })
  })

  describe('Source union type', () => {
    it('should accept XtreamSource', () => {
      const source: Source = {
        id: 'xtream-1',
        name: 'Xtream Provider',
        type: 'xtream',
        serverUrl: 'http://example.com:8080',
        username: 'user',
        password: 'pass',
        createdAt: Date.now(),
      }

      expect(source.type).toBe('xtream')
    })

    it('should accept M3USource', () => {
      const source: Source = {
        id: 'm3u-1',
        name: 'M3U Provider',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        createdAt: Date.now(),
      }

      expect(source.type).toBe('m3u')
    })
  })

  describe('isXtreamSource type guard', () => {
    it('should return true for Xtream sources', () => {
      const source: Source = {
        id: 'xtream-1',
        name: 'Xtream',
        type: 'xtream',
        serverUrl: 'http://example.com',
        username: 'user',
        password: 'pass',
        createdAt: Date.now(),
      }

      expect(isXtreamSource(source)).toBe(true)
    })

    it('should return false for M3U sources', () => {
      const source: Source = {
        id: 'm3u-1',
        name: 'M3U',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        createdAt: Date.now(),
      }

      expect(isXtreamSource(source)).toBe(false)
    })

    it('should narrow the type correctly', () => {
      const source: Source = {
        id: 'xtream-1',
        name: 'Xtream',
        type: 'xtream',
        serverUrl: 'http://example.com',
        username: 'user',
        password: 'pass',
        createdAt: Date.now(),
      }

      if (isXtreamSource(source)) {
        // TypeScript should know source is XtreamSource here
        expect(source.serverUrl).toBe('http://example.com')
        expect(source.username).toBe('user')
        expect(source.password).toBe('pass')
      }
    })
  })

  describe('isM3USource type guard', () => {
    it('should return true for M3U sources', () => {
      const source: Source = {
        id: 'm3u-1',
        name: 'M3U',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        createdAt: Date.now(),
      }

      expect(isM3USource(source)).toBe(true)
    })

    it('should return false for Xtream sources', () => {
      const source: Source = {
        id: 'xtream-1',
        name: 'Xtream',
        type: 'xtream',
        serverUrl: 'http://example.com',
        username: 'user',
        password: 'pass',
        createdAt: Date.now(),
      }

      expect(isM3USource(source)).toBe(false)
    })

    it('should narrow the type correctly', () => {
      const source: Source = {
        id: 'm3u-1',
        name: 'M3U',
        type: 'm3u',
        playlistUrl: 'http://example.com/playlist.m3u',
        epgUrl: 'http://example.com/epg.xml',
        createdAt: Date.now(),
      }

      if (isM3USource(source)) {
        // TypeScript should know source is M3USource here
        expect(source.playlistUrl).toBe('http://example.com/playlist.m3u')
        expect(source.epgUrl).toBe('http://example.com/epg.xml')
      }
    })
  })

  describe('XtreamServerInfo', () => {
    it('should define server information fields', () => {
      const serverInfo: XtreamServerInfo = {
        url: 'example.com',
        port: '8080',
        serverProtocol: 'http',
        timezone: 'America/New_York',
        timestampNow: 1705500000,
      }

      expect(serverInfo.url).toBe('example.com')
      expect(serverInfo.port).toBe('8080')
      expect(serverInfo.serverProtocol).toBe('http')
      expect(serverInfo.timezone).toBe('America/New_York')
      expect(serverInfo.timestampNow).toBe(1705500000)
    })

    it('should support optional HTTPS and RTMP ports', () => {
      const serverInfo: XtreamServerInfo = {
        url: 'example.com',
        port: '8080',
        httpsPort: '8443',
        serverProtocol: 'https',
        rtmpPort: '1935',
        timezone: 'UTC',
        timestampNow: 1705500000,
        timeFormat: '24',
      }

      expect(serverInfo.httpsPort).toBe('8443')
      expect(serverInfo.rtmpPort).toBe('1935')
      expect(serverInfo.timeFormat).toBe('24')
    })
  })

  describe('XtreamUserInfo', () => {
    it('should define user information fields', () => {
      const userInfo: XtreamUserInfo = {
        username: 'testuser',
        status: 'Active',
        expDate: 1735689600,
        isTrial: false,
        activeCons: 1,
        createdAt: 1704067200,
        maxConnections: 2,
        allowedOutputFormats: ['m3u8', 'ts'],
      }

      expect(userInfo.username).toBe('testuser')
      expect(userInfo.status).toBe('Active')
      expect(userInfo.expDate).toBe(1735689600)
      expect(userInfo.isTrial).toBe(false)
      expect(userInfo.activeCons).toBe(1)
      expect(userInfo.maxConnections).toBe(2)
      expect(userInfo.allowedOutputFormats).toEqual(['m3u8', 'ts'])
    })

    it('should support null expiration date for unlimited accounts', () => {
      const userInfo: XtreamUserInfo = {
        username: 'admin',
        status: 'Active',
        expDate: null,
        isTrial: false,
        activeCons: 0,
        createdAt: '2024-01-01',
        maxConnections: 10,
        allowedOutputFormats: ['m3u8', 'ts', 'rtmp'],
      }

      expect(userInfo.expDate).toBeNull()
    })
  })

  describe('XtreamAuthResponse', () => {
    it('should combine user and server info', () => {
      const authResponse: XtreamAuthResponse = {
        userInfo: {
          username: 'testuser',
          status: 'Active',
          expDate: 1735689600,
          isTrial: false,
          activeCons: 1,
          createdAt: 1704067200,
          maxConnections: 2,
          allowedOutputFormats: ['m3u8'],
        },
        serverInfo: {
          url: 'example.com',
          port: '8080',
          serverProtocol: 'http',
          timezone: 'UTC',
          timestampNow: 1705500000,
        },
      }

      expect(authResponse.userInfo.username).toBe('testuser')
      expect(authResponse.serverInfo.url).toBe('example.com')
    })
  })

  describe('SourceValidationResult', () => {
    it('should represent a valid source', () => {
      const result: SourceValidationResult = {
        isValid: true,
        channelCount: 500,
        vodCount: 1000,
        seriesCount: 200,
      }

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.channelCount).toBe(500)
    })

    it('should represent an invalid source with error', () => {
      const result: SourceValidationResult = {
        isValid: false,
        error: 'Authentication failed: Invalid credentials',
      }

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Authentication failed: Invalid credentials')
    })

    it('should include auth response for Xtream sources', () => {
      const result: SourceValidationResult = {
        isValid: true,
        authResponse: {
          userInfo: {
            username: 'user',
            status: 'Active',
            expDate: 1735689600,
            isTrial: false,
            activeCons: 0,
            createdAt: 1704067200,
            maxConnections: 2,
            allowedOutputFormats: ['m3u8'],
          },
          serverInfo: {
            url: 'example.com',
            port: '8080',
            serverProtocol: 'http',
            timezone: 'UTC',
            timestampNow: 1705500000,
          },
        },
        channelCount: 100,
      }

      expect(result.authResponse).toBeDefined()
      expect(result.authResponse?.userInfo.status).toBe('Active')
    })
  })

  describe('SourceInput types', () => {
    it('should define XtreamSourceInput', () => {
      const input: XtreamSourceInput = {
        name: 'New Xtream',
        serverUrl: 'http://example.com:8080',
        username: 'user',
        password: 'pass',
      }

      expect(input.name).toBe('New Xtream')
      expect(input.serverUrl).toBe('http://example.com:8080')
    })

    it('should define M3USourceInput', () => {
      const input: M3USourceInput = {
        name: 'New M3U',
        playlistUrl: 'http://example.com/playlist.m3u',
        epgUrl: 'http://example.com/epg.xml',
      }

      expect(input.name).toBe('New M3U')
      expect(input.playlistUrl).toBe('http://example.com/playlist.m3u')
      expect(input.epgUrl).toBe('http://example.com/epg.xml')
    })

    it('should define SourceInput union with type discriminator', () => {
      const xtreamInput: SourceInput = {
        type: 'xtream',
        name: 'Xtream',
        serverUrl: 'http://example.com',
        username: 'user',
        password: 'pass',
      }

      const m3uInput: SourceInput = {
        type: 'm3u',
        name: 'M3U',
        playlistUrl: 'http://example.com/playlist.m3u',
      }

      expect(xtreamInput.type).toBe('xtream')
      expect(m3uInput.type).toBe('m3u')
    })
  })
})
