/**
 * Tests for PlayerFactory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPlayer,
  getRecommendedPlayerType,
  isPlayerTypeSupported,
  getPlayerSupportSummary,
} from './PlayerFactory'
import { NativePlayerAdapter } from './NativePlayerAdapter'
import * as capabilityDetector from './capabilityDetector'

// Mock the capability detector
vi.mock('./capabilityDetector', async () => {
  const actual = await vi.importActual('./capabilityDetector') as typeof capabilityDetector
  return {
    ...actual,
    detectCapabilities: vi.fn(),
    detectNativeHLSSupport: vi.fn(),
    recommendPlayerStrategy: vi.fn(),
  }
})

// Mock the ShakaPlayerAdapter module
vi.mock('./ShakaPlayerAdapter', () => ({
  ShakaPlayerAdapter: class MockShakaPlayerAdapter {
    initialize = vi.fn().mockResolvedValue(undefined)
    load = vi.fn().mockResolvedValue(undefined)
    play = vi.fn().mockResolvedValue(undefined)
    pause = vi.fn()
    seek = vi.fn()
    setVolume = vi.fn()
    mute = vi.fn()
    unmute = vi.fn()
    setQuality = vi.fn()
    setAudioTrack = vi.fn()
    setSubtitleTrack = vi.fn()
    getState = vi.fn().mockReturnValue({})
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    destroy = vi.fn().mockResolvedValue(undefined)
  },
  isShakaSupported: vi.fn().mockResolvedValue(true),
}))

describe('PlayerFactory', () => {
  const mockCapabilities = {
    mse: true,
    eme: true,
    hls: true,
    dash: true,
    nativeVideo: true,
    supportedVideoCodecs: ['avc1.42E01E'],
    supportedAudioCodecs: ['mp4a.40.2'],
  }

  beforeEach(() => {
    vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue(mockCapabilities)
    vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(false)
    vi.mocked(capabilityDetector.recommendPlayerStrategy).mockReturnValue('shaka')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createPlayer', () => {
    it('should create a native player when playerType is native', async () => {
      const result = await createPlayer({ playerType: 'native' })

      expect(result.type).toBe('native')
      expect(result.player).toBeInstanceOf(NativePlayerAdapter)
      expect(result.capabilities).toEqual(mockCapabilities)
    })

    it('should create a Shaka player when playerType is shaka and MSE is available', async () => {
      const result = await createPlayer({ playerType: 'shaka' })

      expect(result.type).toBe('shaka')
      expect(result.player).toBeDefined()
      expect(result.capabilities).toEqual(mockCapabilities)
    })

    it('should throw error when shaka is requested but MSE not available', async () => {
      vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
        ...mockCapabilities,
        mse: false,
      })

      await expect(createPlayer({ playerType: 'shaka' })).rejects.toThrow(
        'Shaka Player requires MSE support'
      )
    })

    it('should auto-select Shaka for HLS streams when native HLS not supported', async () => {
      vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(false)

      const result = await createPlayer({
        playerType: 'auto',
        streamUrl: 'https://example.com/stream.m3u8',
      })

      expect(result.type).toBe('shaka')
    })

    it('should auto-select native for HLS streams when native HLS is supported', async () => {
      vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(true)

      const result = await createPlayer({
        playerType: 'auto',
        streamUrl: 'https://example.com/stream.m3u8',
      })

      expect(result.type).toBe('native')
    })

    it('should auto-select Shaka for DASH streams', async () => {
      const result = await createPlayer({
        playerType: 'auto',
        streamUrl: 'https://example.com/manifest.mpd',
      })

      expect(result.type).toBe('shaka')
    })

    it('should auto-select native for MP4 streams', async () => {
      const result = await createPlayer({
        playerType: 'auto',
        streamUrl: 'https://example.com/video.mp4',
      })

      expect(result.type).toBe('native')
    })

    it('should fall back to native if Shaka fails to load', async () => {
      // Make Shaka import fail
      vi.doMock('./ShakaPlayerAdapter', () => {
        throw new Error('Failed to load Shaka')
      })

      // Reset the module cache for this specific test
      vi.resetModules()

      // Import fresh factory
      const { createPlayer: freshCreatePlayer } = await import('./PlayerFactory')

      // Mock capabilities again after reset
      const { detectCapabilities, detectNativeHLSSupport } = await import('./capabilityDetector')
      vi.mocked(detectCapabilities).mockReturnValue(mockCapabilities)
      vi.mocked(detectNativeHLSSupport).mockReturnValue(false)

      const result = await freshCreatePlayer({
        streamUrl: 'https://example.com/stream.m3u8',
      })

      // Should fall back to native
      expect(result.type).toBe('native')
    })

    it('should default to auto player type when not specified', async () => {
      const result = await createPlayer({})

      expect(result.player).toBeDefined()
      expect(result.capabilities).toBeDefined()
    })
  })

  describe('getRecommendedPlayerType', () => {
    it('should return unsupported when no video playback is available', () => {
      vi.mocked(capabilityDetector.recommendPlayerStrategy).mockReturnValue('unsupported')

      const result = getRecommendedPlayerType()
      expect(result).toBe('unsupported')
    })

    it('should return shaka for DASH streams', () => {
      const result = getRecommendedPlayerType('https://example.com/manifest.mpd')
      expect(result).toBe('shaka')
    })

    it('should return native for MP4 streams', () => {
      const result = getRecommendedPlayerType('https://example.com/video.mp4')
      expect(result).toBe('native')
    })

    it('should return native for HLS when native HLS is supported', () => {
      vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(true)

      const result = getRecommendedPlayerType('https://example.com/stream.m3u8')
      expect(result).toBe('native')
    })

    it('should return shaka for HLS when native HLS is not supported', () => {
      vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(false)

      const result = getRecommendedPlayerType('https://example.com/stream.m3u8')
      expect(result).toBe('shaka')
    })

    it('should return recommendation without stream URL', () => {
      vi.mocked(capabilityDetector.recommendPlayerStrategy).mockReturnValue('shaka')

      const result = getRecommendedPlayerType()
      expect(result).toBe('shaka')
    })
  })

  describe('isPlayerTypeSupported', () => {
    it('should return true for shaka when MSE is available', () => {
      expect(isPlayerTypeSupported('shaka')).toBe(true)
    })

    it('should return false for shaka when MSE is not available', () => {
      vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
        ...mockCapabilities,
        mse: false,
      })

      expect(isPlayerTypeSupported('shaka')).toBe(false)
    })

    it('should return true for native when nativeVideo is available', () => {
      expect(isPlayerTypeSupported('native')).toBe(true)
    })

    it('should return false for native when nativeVideo is not available', () => {
      vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
        ...mockCapabilities,
        nativeVideo: false,
      })

      expect(isPlayerTypeSupported('native')).toBe(false)
    })

    it('should return true for auto when any player is available', () => {
      expect(isPlayerTypeSupported('auto')).toBe(true)
    })

    it('should return false for auto when no player is available', () => {
      vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
        ...mockCapabilities,
        mse: false,
        nativeVideo: false,
      })

      expect(isPlayerTypeSupported('auto')).toBe(false)
    })
  })

  describe('getPlayerSupportSummary', () => {
    it('should return complete support summary', () => {
      const summary = getPlayerSupportSummary()

      expect(summary).toEqual({
        shaka: true,
        native: true,
        recommended: 'shaka',
        capabilities: mockCapabilities,
      })
    })

    it('should reflect actual capabilities', () => {
      vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
        ...mockCapabilities,
        mse: false,
      })
      vi.mocked(capabilityDetector.recommendPlayerStrategy).mockReturnValue('native')

      const summary = getPlayerSupportSummary()

      expect(summary.shaka).toBe(false)
      expect(summary.native).toBe(true)
      expect(summary.recommended).toBe('native')
    })
  })
})

describe('Stream type detection', () => {
  beforeEach(() => {
    vi.mocked(capabilityDetector.detectCapabilities).mockReturnValue({
      mse: true,
      eme: true,
      hls: true,
      dash: true,
      nativeVideo: true,
      supportedVideoCodecs: ['avc1.42E01E'],
      supportedAudioCodecs: ['mp4a.40.2'],
    })
    vi.mocked(capabilityDetector.detectNativeHLSSupport).mockReturnValue(false)
  })

  it('should detect HLS from .m3u8 extension', () => {
    const result = getRecommendedPlayerType('https://example.com/video.m3u8')
    expect(result).toBe('shaka') // Shaka for HLS without native support
  })

  it('should detect HLS from /hls/ path', () => {
    const result = getRecommendedPlayerType('https://example.com/hls/stream/playlist')
    expect(result).toBe('shaka')
  })

  it('should detect DASH from .mpd extension', () => {
    const result = getRecommendedPlayerType('https://example.com/manifest.mpd')
    expect(result).toBe('shaka')
  })

  it('should detect DASH from /dash/ path', () => {
    const result = getRecommendedPlayerType('https://example.com/dash/stream/manifest')
    expect(result).toBe('shaka')
  })

  it('should detect MP4 from .mp4 extension', () => {
    const result = getRecommendedPlayerType('https://example.com/video.mp4')
    expect(result).toBe('native')
  })

  it('should detect MP4 from .m4v extension', () => {
    const result = getRecommendedPlayerType('https://example.com/video.m4v')
    expect(result).toBe('native')
  })
})
