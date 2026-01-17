/**
 * Tests for ShakaPlayerAdapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ShakaPlayerAdapter, isShakaSupported } from './ShakaPlayerAdapter'

// Track configuration state
let abrEnabled = true

// Create mock variant tracks
const mockVariantTracks = [
  {
    id: 1,
    active: true,
    height: 1080,
    width: 1920,
    bandwidth: 5000000,
    language: 'en',
    label: 'English',
    videoCodec: 'avc1.4d401f',
    audioCodec: 'mp4a.40.2',
    channelsCount: 2,
    audioId: 1,
  },
  {
    id: 2,
    active: false,
    height: 720,
    width: 1280,
    bandwidth: 3000000,
    language: 'en',
    label: 'English',
    videoCodec: 'avc1.4d401e',
    audioCodec: 'mp4a.40.2',
    channelsCount: 2,
    audioId: 1,
  },
]

// Create mock text tracks
const mockTextTracks = [
  {
    id: 1,
    active: false,
    language: 'en',
    label: 'English',
    kind: 'subtitles',
    mimeType: 'text/vtt',
  },
]

// Mock Shaka Player module
vi.mock('shaka-player', () => {
  class MockPlayer {
    static isBrowserSupported = vi.fn().mockReturnValue(true)
    attach = vi.fn().mockResolvedValue(undefined)
    configure = vi.fn((key: string | object, value?: unknown) => {
      if (typeof key === 'string' && key === 'abr.enabled') {
        abrEnabled = value as boolean
      } else if (typeof key === 'object' && key !== null && 'abr' in key) {
        const keyObj = key as { abr?: { enabled?: boolean } }
        if (keyObj.abr?.enabled !== undefined) {
          abrEnabled = keyObj.abr.enabled
        }
      }
    })
    load = vi.fn().mockResolvedValue(undefined)
    destroy = vi.fn().mockResolvedValue(undefined)
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    getVariantTracks = vi.fn().mockReturnValue(mockVariantTracks)
    getTextTracks = vi.fn().mockReturnValue(mockTextTracks)
    selectVariantTrack = vi.fn()
    selectTextTrack = vi.fn()
    setTextTrackVisibility = vi.fn()
    isTextTrackVisible = vi.fn().mockReturnValue(false)
    getConfiguration = vi.fn(() => ({ abr: { enabled: abrEnabled } }))
  }

  return {
    default: {
      Player: MockPlayer,
      polyfill: {
        installAll: vi.fn(),
      },
    },
    Player: MockPlayer,
    polyfill: {
      installAll: vi.fn(),
    },
  }
})

describe('ShakaPlayerAdapter', () => {
  let adapter: ShakaPlayerAdapter
  let videoElement: HTMLVideoElement

  beforeEach(() => {
    // Reset ABR state
    abrEnabled = true

    adapter = new ShakaPlayerAdapter()

    // Create a mock video element
    videoElement = document.createElement('video')
    Object.defineProperty(videoElement, 'readyState', { value: 4, writable: true })
    Object.defineProperty(videoElement, 'videoWidth', { value: 1920, writable: true })
    Object.defineProperty(videoElement, 'videoHeight', { value: 1080, writable: true })
  })

  afterEach(async () => {
    if (adapter) {
      await adapter.destroy()
    }
    vi.clearAllMocks()
  })

  describe('isShakaSupported', () => {
    it('should check if Shaka Player is supported', async () => {
      const supported = await isShakaSupported()
      expect(supported).toBe(true)
    })
  })

  describe('initialize', () => {
    it('should initialize with a video element', async () => {
      await adapter.initialize(videoElement)

      const state = adapter.getState()
      expect(state.playbackState).toBe('idle')
    })

    it('should accept custom configuration', async () => {
      await adapter.initialize(videoElement, {
        bufferSize: 60,
        initialVolume: 0.5,
      })

      const state = adapter.getState()
      expect(state.volume).toBe(0.5)
    })

    it('should throw if already initialized', async () => {
      await adapter.initialize(videoElement)

      await expect(adapter.initialize(videoElement)).rejects.toThrow(
        'Player already initialized'
      )
    })
  })

  describe('load', () => {
    beforeEach(async () => {
      await adapter.initialize(videoElement)
    })

    it('should load an HLS stream', async () => {
      await adapter.load('https://example.com/stream.m3u8')

      const state = adapter.getState()
      expect(state.streamType).toBe('hls')
    })

    it('should load a DASH stream', async () => {
      await adapter.load('https://example.com/manifest.mpd')

      const state = adapter.getState()
      expect(state.streamType).toBe('dash')
    })

    it('should set loading state during load', async () => {
      // Start load
      const loadPromise = adapter.load('https://example.com/stream.m3u8')

      // Check that it was loading
      const loadingState = adapter.getState()
      expect(loadingState.playbackState).toBe('loading')

      await loadPromise
    })

    it('should auto-play when specified', async () => {
      const playSpy = vi.spyOn(adapter, 'play').mockResolvedValue(undefined)

      await adapter.load('https://example.com/stream.m3u8', true)

      expect(playSpy).toHaveBeenCalled()
    })
  })

  describe('setQuality', () => {
    beforeEach(async () => {
      await adapter.initialize(videoElement)
    })

    it('should enable ABR when quality is null', () => {
      adapter.setQuality(null)

      const state = adapter.getState()
      expect(state.isAutoQuality).toBe(true)
    })

    it('should select specific quality track', () => {
      const qualityTrack = {
        id: '1',
        label: '1080p',
        height: 1080,
        width: 1920,
        bitrate: 5000000,
      }

      adapter.setQuality(qualityTrack)

      const state = adapter.getState()
      expect(state.isAutoQuality).toBe(false)
    })
  })

  describe('setAudioTrack', () => {
    beforeEach(async () => {
      await adapter.initialize(videoElement)
    })

    it('should attempt to select an audio track by language', () => {
      const audioTrack = {
        id: '1',
        label: 'English',
        language: 'en',
      }

      // This should not throw
      adapter.setAudioTrack(audioTrack)

      // The track selection depends on Shaka finding a matching variant
      // In our mock, there IS a matching track with language 'en'
      const state = adapter.getState()
      expect(state.selectedAudioTrack).toEqual(audioTrack)
    })

    it('should not update state if no matching track found', () => {
      const audioTrack = {
        id: 'nonexistent',
        label: 'French',
        language: 'fr',
      }

      adapter.setAudioTrack(audioTrack)

      const state = adapter.getState()
      // No update since no matching track
      expect(state.selectedAudioTrack).toBeNull()
    })
  })

  describe('setSubtitleTrack', () => {
    beforeEach(async () => {
      await adapter.initialize(videoElement)
    })

    it('should disable subtitles when track is null', () => {
      adapter.setSubtitleTrack(null)

      const state = adapter.getState()
      expect(state.selectedSubtitleTrack).toBeNull()
    })

    it('should attempt to select a subtitle track by language', () => {
      const subtitleTrack = {
        id: '1',
        label: 'English',
        language: 'en',
      }

      adapter.setSubtitleTrack(subtitleTrack)

      // In our mock, there IS a matching text track with language 'en'
      const state = adapter.getState()
      expect(state.selectedSubtitleTrack).toEqual(subtitleTrack)
    })

    it('should not update state if no matching track found', () => {
      const subtitleTrack = {
        id: 'nonexistent',
        label: 'French',
        language: 'fr',
      }

      adapter.setSubtitleTrack(subtitleTrack)

      const state = adapter.getState()
      // No update since no matching track
      expect(state.selectedSubtitleTrack).toBeNull()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', async () => {
      await adapter.initialize(videoElement)
      await adapter.destroy()

      // Attempting operations after destroy should throw
      await expect(adapter.play()).rejects.toThrow()
    })
  })

  describe('stream type detection', () => {
    beforeEach(async () => {
      await adapter.initialize(videoElement)
    })

    it('should detect HLS from .m3u8 extension', async () => {
      await adapter.load('https://example.com/playlist.m3u8')
      expect(adapter.getState().streamType).toBe('hls')
    })

    it('should detect HLS from /hls/ in path', async () => {
      await adapter.load('https://example.com/hls/stream/index')
      expect(adapter.getState().streamType).toBe('hls')
    })

    it('should detect DASH from .mpd extension', async () => {
      await adapter.load('https://example.com/manifest.mpd')
      expect(adapter.getState().streamType).toBe('dash')
    })

    it('should detect DASH from /dash/ in path', async () => {
      await adapter.load('https://example.com/dash/stream/manifest')
      expect(adapter.getState().streamType).toBe('dash')
    })
  })
})
