/**
 * Tests for BasePlayerAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BasePlayerAdapter } from './BasePlayerAdapter'
import type {
  PlayerConfig,
  QualityTrack,
  AudioTrack,
  SubtitleTrack,
} from '../types/player'

// Mock MediaError constants (not available in jsdom)
const MEDIA_ERR_ABORTED = 1
const MEDIA_ERR_NETWORK = 2
const MEDIA_ERR_DECODE = 3
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4

/**
 * Concrete implementation for testing the abstract base class
 */
class TestPlayerAdapter extends BasePlayerAdapter {
  public loadCalled = false
  public loadedUrl: string | null = null

  async load(url: string, autoPlay?: boolean): Promise<void> {
    this.ensureInitialized()
    this.loadCalled = true
    this.loadedUrl = url
    const streamType = this.detectStreamType(url)
    this.setCurrentStream(url, streamType)
    this.setPlaybackState('loading')

    if (autoPlay && this.videoElement) {
      await this.videoElement.play()
    }
  }

  setQuality(quality: QualityTrack | null): void {
    this.ensureInitialized()
    this.setSelectedQuality(quality, quality === null)
  }

  setAudioTrack(track: AudioTrack): void {
    this.ensureInitialized()
    this.setSelectedAudioTrack(track)
  }

  setSubtitleTrack(track: SubtitleTrack | null): void {
    this.ensureInitialized()
    this.setSelectedSubtitleTrack(track)
  }

  // Expose protected methods for testing
  public exposedSetPlaybackState(state: Parameters<typeof this.setPlaybackState>[0]) {
    this.setPlaybackState(state)
  }

  public exposedSetError(
    code: Parameters<typeof this.setError>[0],
    message: Parameters<typeof this.setError>[1],
    recoverable: Parameters<typeof this.setError>[2],
    cause?: Parameters<typeof this.setError>[3]
  ) {
    this.setError(code, message, recoverable, cause)
  }

  public exposedClearError() {
    this.clearError()
  }

  public exposedSetQualityTracks(tracks: QualityTrack[]) {
    this.setQualityTracks(tracks)
  }

  public exposedSetAudioTracks(tracks: AudioTrack[]) {
    this.setAudioTracks(tracks)
  }

  public exposedSetSubtitleTracks(tracks: SubtitleTrack[]) {
    this.setSubtitleTracks(tracks)
  }

  public exposedEmitTracksLoaded() {
    this.emitTracksLoaded()
  }

  public exposedDetectStreamType(url: string) {
    return this.detectStreamType(url)
  }

  public exposedGetBufferedAhead() {
    return this.getBufferedAhead()
  }

  public getVideoElement() {
    return this.videoElement
  }

  public getConfig() {
    return this.config
  }
}

/**
 * Create a mock video element
 */
function createMockVideoElement(): HTMLVideoElement {
  const element = {
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 0,
    buffered: {
      length: 0,
      start: vi.fn(),
      end: vi.fn(),
    },
    error: null,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    canPlayType: vi.fn().mockReturnValue('probably'),
  }
  return element as unknown as HTMLVideoElement
}

describe('BasePlayerAdapter', () => {
  let adapter: TestPlayerAdapter
  let mockVideoElement: HTMLVideoElement

  beforeEach(() => {
    adapter = new TestPlayerAdapter()
    mockVideoElement = createMockVideoElement()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should initialize with video element', async () => {
      await adapter.initialize(mockVideoElement)

      expect(adapter.getVideoElement()).toBe(mockVideoElement)
      expect(adapter.getState().playbackState).toBe('idle')
    })

    it('should apply config on initialization', async () => {
      const config: PlayerConfig = {
        initialVolume: 0.5,
        startMuted: true,
      }

      await adapter.initialize(mockVideoElement, config)

      expect(mockVideoElement.volume).toBe(0.5)
      expect(mockVideoElement.muted).toBe(true)
      expect(adapter.getState().volume).toBe(0.5)
      expect(adapter.getState().isMuted).toBe(true)
    })

    it('should use default config when none provided', async () => {
      await adapter.initialize(mockVideoElement)

      expect(adapter.getConfig().initialVolume).toBe(1)
      expect(adapter.getConfig().startMuted).toBe(false)
      expect(adapter.getConfig().autoPlay).toBe(false)
    })

    it('should attach video element event listeners', async () => {
      await adapter.initialize(mockVideoElement)

      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('play', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('durationchange', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('volumechange', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('waiting', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('playing', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should throw error if already initialized', async () => {
      await adapter.initialize(mockVideoElement)

      await expect(adapter.initialize(mockVideoElement)).rejects.toThrow('Player already initialized')
    })

    it('should throw error if destroyed', async () => {
      await adapter.initialize(mockVideoElement)
      await adapter.destroy()

      await expect(adapter.initialize(mockVideoElement)).rejects.toThrow('Cannot initialize a destroyed player')
    })
  })

  describe('load', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should load a stream URL', async () => {
      await adapter.load('http://example.com/stream.m3u8')

      expect(adapter.loadCalled).toBe(true)
      expect(adapter.loadedUrl).toBe('http://example.com/stream.m3u8')
      expect(adapter.getState().currentUrl).toBe('http://example.com/stream.m3u8')
      expect(adapter.getState().streamType).toBe('hls')
    })

    it('should detect DASH stream type', async () => {
      await adapter.load('http://example.com/manifest.mpd')

      expect(adapter.getState().streamType).toBe('dash')
    })

    it('should detect MP4 stream type', async () => {
      await adapter.load('http://example.com/video.mp4')

      expect(adapter.getState().streamType).toBe('mp4')
    })

    it('should throw if not initialized', async () => {
      const newAdapter = new TestPlayerAdapter()

      await expect(newAdapter.load('http://example.com/stream.m3u8')).rejects.toThrow('Player not initialized')
    })
  })

  describe('play/pause', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should call play on video element', async () => {
      await adapter.play()

      expect(mockVideoElement.play).toHaveBeenCalled()
    })

    it('should call pause on video element', () => {
      adapter.pause()

      expect(mockVideoElement.pause).toHaveBeenCalled()
    })

    it('should throw on play if not initialized', async () => {
      const newAdapter = new TestPlayerAdapter()

      await expect(newAdapter.play()).rejects.toThrow('Player not initialized')
    })

    it('should throw on pause if not initialized', () => {
      const newAdapter = new TestPlayerAdapter()

      expect(() => newAdapter.pause()).toThrow('Player not initialized')
    })
  })

  describe('seek', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should set currentTime on video element', () => {
      // Set duration to allow seeking
      Object.defineProperty(mockVideoElement, 'duration', { value: 100, writable: true })
      adapter.exposedSetPlaybackState('playing')

      adapter.seek(50)

      expect(mockVideoElement.currentTime).toBe(50)
    })

    it('should clamp seek time to valid range', async () => {
      // Simulate durationchange event to set state.duration
      const eventHandlers = new Map<string, () => void>()

      // Need to reinitialize to get the event handlers
      const testAdapter = new TestPlayerAdapter()
      const testVideo = createMockVideoElement()
      testVideo.addEventListener = vi.fn((event: string, handler: () => void) => {
        eventHandlers.set(event, handler)
      })

      await testAdapter.initialize(testVideo)

      // Simulate duration change to set state.duration and isSeekable
      Object.defineProperty(testVideo, 'duration', { value: 100, writable: true })
      eventHandlers.get('durationchange')?.()

      testAdapter.seek(-10)
      expect(testVideo.currentTime).toBe(0)

      testAdapter.seek(200)
      expect(testVideo.currentTime).toBe(100)
    })

    it('should not seek when not seekable', async () => {
      // Simulate a live stream where isSeekable is false
      const eventHandlers = new Map<string, () => void>()
      const testAdapter = new TestPlayerAdapter()
      const testVideo = createMockVideoElement()
      testVideo.addEventListener = vi.fn((event: string, handler: () => void) => {
        eventHandlers.set(event, handler)
      })

      await testAdapter.initialize(testVideo)

      // Simulate duration change for a live stream (Infinity makes isSeekable false)
      Object.defineProperty(testVideo, 'duration', { value: Infinity, writable: true })
      eventHandlers.get('durationchange')?.()

      // Verify the state is not seekable
      expect(testAdapter.getState().isSeekable).toBe(false)

      // Attempt to seek - should be ignored because isSeekable is false
      const originalTime = testVideo.currentTime
      testAdapter.seek(50)
      expect(testVideo.currentTime).toBe(originalTime)
    })
  })

  describe('volume control', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should set volume on video element', () => {
      adapter.setVolume(0.5)

      expect(mockVideoElement.volume).toBe(0.5)
    })

    it('should clamp volume to valid range', () => {
      adapter.setVolume(-0.5)
      expect(mockVideoElement.volume).toBe(0)

      adapter.setVolume(1.5)
      expect(mockVideoElement.volume).toBe(1)
    })

    it('should mute video element', () => {
      adapter.mute()

      expect(mockVideoElement.muted).toBe(true)
    })

    it('should unmute video element', () => {
      mockVideoElement.muted = true
      adapter.unmute()

      expect(mockVideoElement.muted).toBe(false)
    })
  })

  describe('track selection', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should set quality track', () => {
      const qualityTrack: QualityTrack = {
        id: '1080p',
        label: '1080p',
        height: 1080,
        width: 1920,
        bitrate: 5000000,
      }

      adapter.setQuality(qualityTrack)

      const state = adapter.getState()
      expect(state.selectedQuality).toEqual(qualityTrack)
      expect(state.isAutoQuality).toBe(false)
    })

    it('should set auto quality when null', () => {
      adapter.setQuality(null)

      const state = adapter.getState()
      expect(state.selectedQuality).toBe(null)
      expect(state.isAutoQuality).toBe(true)
    })

    it('should set audio track', () => {
      const audioTrack: AudioTrack = {
        id: 'en',
        label: 'English',
        language: 'en',
      }

      adapter.setAudioTrack(audioTrack)

      expect(adapter.getState().selectedAudioTrack).toEqual(audioTrack)
    })

    it('should set subtitle track', () => {
      const subtitleTrack: SubtitleTrack = {
        id: 'en-cc',
        label: 'English CC',
        language: 'en',
        isClosedCaption: true,
      }

      adapter.setSubtitleTrack(subtitleTrack)

      expect(adapter.getState().selectedSubtitleTrack).toEqual(subtitleTrack)
    })

    it('should disable subtitles when set to null', () => {
      adapter.setSubtitleTrack(null)

      expect(adapter.getState().selectedSubtitleTrack).toBe(null)
    })
  })

  describe('event handling', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should add and call event listener', () => {
      const listener = vi.fn()
      adapter.addEventListener('statechange', listener)

      adapter.exposedSetPlaybackState('playing')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'statechange',
          previousState: 'idle',
          newState: 'playing',
        })
      )
    })

    it('should remove event listener', () => {
      const listener = vi.fn()
      adapter.addEventListener('statechange', listener)
      adapter.removeEventListener('statechange', listener)

      adapter.exposedSetPlaybackState('playing')

      expect(listener).not.toHaveBeenCalled()
    })

    it('should support multiple listeners for same event', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      adapter.addEventListener('statechange', listener1)
      adapter.addEventListener('statechange', listener2)

      adapter.exposedSetPlaybackState('playing')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should emit quality change event', () => {
      const listener = vi.fn()
      adapter.addEventListener('qualitychange', listener)

      const quality: QualityTrack = {
        id: '720p',
        label: '720p',
        height: 720,
        width: 1280,
        bitrate: 3000000,
      }
      adapter.setQuality(quality)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'qualitychange',
          newQuality: quality,
          isAuto: false,
        })
      )
    })

    it('should emit audio track change event', () => {
      const listener = vi.fn()
      adapter.addEventListener('audiotrackchange', listener)

      const audioTrack: AudioTrack = {
        id: 'es',
        label: 'Spanish',
        language: 'es',
      }
      adapter.setAudioTrack(audioTrack)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audiotrackchange',
          audioTrack,
        })
      )
    })

    it('should emit subtitle track change event', () => {
      const listener = vi.fn()
      adapter.addEventListener('subtitletrackchange', listener)

      const subtitleTrack: SubtitleTrack = {
        id: 'fr',
        label: 'French',
        language: 'fr',
      }
      adapter.setSubtitleTrack(subtitleTrack)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'subtitletrackchange',
          subtitleTrack,
        })
      )
    })

    it('should emit tracks loaded event', () => {
      const listener = vi.fn()
      adapter.addEventListener('tracksloaded', listener)

      const qualityTracks: QualityTrack[] = [
        { id: '1080p', label: '1080p', height: 1080, width: 1920, bitrate: 5000000 },
      ]
      const audioTracks: AudioTrack[] = [
        { id: 'en', label: 'English', language: 'en' },
      ]
      const subtitleTracks: SubtitleTrack[] = [
        { id: 'en', label: 'English', language: 'en' },
      ]

      adapter.exposedSetQualityTracks(qualityTracks)
      adapter.exposedSetAudioTracks(audioTracks)
      adapter.exposedSetSubtitleTracks(subtitleTracks)
      adapter.exposedEmitTracksLoaded()

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tracksloaded',
          qualityTracks,
          audioTracks,
          subtitleTracks,
        })
      )
    })

    it('should catch errors in event listeners', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const badListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const goodListener = vi.fn()

      adapter.addEventListener('statechange', badListener)
      adapter.addEventListener('statechange', goodListener)

      adapter.exposedSetPlaybackState('playing')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in player event listener'),
        expect.any(Error)
      )
      expect(goodListener).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should set error state', () => {
      const listener = vi.fn()
      adapter.addEventListener('error', listener)

      adapter.exposedSetError('NETWORK_ERROR', 'Network failed', true)

      const state = adapter.getState()
      expect(state.playbackState).toBe('error')
      expect(state.error).toEqual(
        expect.objectContaining({
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          recoverable: true,
        })
      )

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            code: 'NETWORK_ERROR',
          }),
        })
      )
    })

    it('should include cause in error', () => {
      const cause = new Error('Original error')
      adapter.exposedSetError('DECODE_ERROR', 'Decode failed', false, cause)

      const state = adapter.getState()
      expect(state.error?.cause).toBe(cause)
    })

    it('should clear error state', () => {
      adapter.exposedSetError('NETWORK_ERROR', 'Network failed', true)
      adapter.exposedClearError()

      expect(adapter.getState().error).toBe(null)
    })
  })

  describe('stream type detection', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should detect HLS from .m3u8 extension', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/stream.m3u8')).toBe('hls')
    })

    it('should detect HLS from /hls/ path', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/hls/stream')).toBe('hls')
    })

    it('should detect DASH from .mpd extension', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/manifest.mpd')).toBe('dash')
    })

    it('should detect DASH from /dash/ path', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/dash/manifest')).toBe('dash')
    })

    it('should detect MP4 from .mp4 extension', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/video.mp4')).toBe('mp4')
    })

    it('should detect MP4 from .m4v extension', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/video.m4v')).toBe('mp4')
    })

    it('should return unknown for unrecognized URLs', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/stream')).toBe('unknown')
    })

    it('should be case insensitive', () => {
      expect(adapter.exposedDetectStreamType('http://example.com/STREAM.M3U8')).toBe('hls')
      expect(adapter.exposedDetectStreamType('http://example.com/MANIFEST.MPD')).toBe('dash')
    })
  })

  describe('buffered calculation', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should return 0 when no buffered ranges', () => {
      expect(adapter.exposedGetBufferedAhead()).toBe(0)
    })

    it('should calculate buffered time ahead of current position', () => {
      Object.defineProperty(mockVideoElement, 'currentTime', { value: 30, writable: true })
      Object.defineProperty(mockVideoElement, 'buffered', {
        value: {
          length: 1,
          start: vi.fn().mockReturnValue(0),
          end: vi.fn().mockReturnValue(60),
        },
        writable: true,
      })

      expect(adapter.exposedGetBufferedAhead()).toBe(30)
    })

    it('should return 0 when current time is outside buffered range', () => {
      Object.defineProperty(mockVideoElement, 'currentTime', { value: 100, writable: true })
      Object.defineProperty(mockVideoElement, 'buffered', {
        value: {
          length: 1,
          start: vi.fn().mockReturnValue(0),
          end: vi.fn().mockReturnValue(60),
        },
        writable: true,
      })

      expect(adapter.exposedGetBufferedAhead()).toBe(0)
    })
  })

  describe('destroy', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should clean up resources on destroy', async () => {
      await adapter.destroy()

      expect(adapter.getVideoElement()).toBe(null)
      expect(mockVideoElement.removeEventListener).toHaveBeenCalledWith('play', expect.any(Function))
      expect(mockVideoElement.removeEventListener).toHaveBeenCalledWith('pause', expect.any(Function))
    })

    it('should reset state on destroy', async () => {
      adapter.exposedSetPlaybackState('playing')
      await adapter.destroy()

      expect(adapter.getState().playbackState).toBe('idle')
    })

    it('should clear event listeners on destroy', async () => {
      const listener = vi.fn()
      adapter.addEventListener('statechange', listener)
      await adapter.destroy()

      // Creating new adapter to test listener was cleared
      const newAdapter = new TestPlayerAdapter()
      await newAdapter.initialize(createMockVideoElement())
      newAdapter.exposedSetPlaybackState('playing')

      expect(listener).not.toHaveBeenCalled()
    })

    it('should be idempotent (safe to call multiple times)', async () => {
      await adapter.destroy()
      await adapter.destroy()

      // Should not throw
      expect(adapter.getVideoElement()).toBe(null)
    })

    it('should throw on operations after destroy', async () => {
      await adapter.destroy()

      // After destroy, initialized=false and destroyed=true
      // ensureInitialized checks initialized first, then destroyed
      // So it throws 'Player not initialized' first
      await expect(adapter.play()).rejects.toThrow('Player not initialized')
      expect(() => adapter.pause()).toThrow('Player not initialized')
    })
  })

  describe('getState', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should return a copy of state', () => {
      const state1 = adapter.getState()
      const state2 = adapter.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })

    it('should not allow external mutation of state', () => {
      const state = adapter.getState()
      state.playbackState = 'playing'

      expect(adapter.getState().playbackState).toBe('idle')
    })
  })

  describe('video element events', () => {
    let eventHandlers: Map<string, (e?: unknown) => void>

    beforeEach(async () => {
      eventHandlers = new Map()
      mockVideoElement.addEventListener = vi.fn((event: string, handler: (e?: unknown) => void) => {
        eventHandlers.set(event, handler)
      })
      mockVideoElement.removeEventListener = vi.fn()

      await adapter.initialize(mockVideoElement)
    })

    it('should handle play event', () => {
      const listener = vi.fn()
      adapter.addEventListener('statechange', listener)

      eventHandlers.get('play')?.()

      expect(adapter.getState().playbackState).toBe('playing')
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'statechange',
          newState: 'playing',
        })
      )
    })

    it('should handle pause event', () => {
      adapter.exposedSetPlaybackState('playing')
      const listener = vi.fn()
      adapter.addEventListener('statechange', listener)

      eventHandlers.get('pause')?.()

      expect(adapter.getState().playbackState).toBe('paused')
    })

    it('should not change state to paused when ended', () => {
      adapter.exposedSetPlaybackState('ended')

      eventHandlers.get('pause')?.()

      expect(adapter.getState().playbackState).toBe('ended')
    })

    it('should handle ended event', () => {
      const stateListener = vi.fn()
      const endedListener = vi.fn()
      adapter.addEventListener('statechange', stateListener)
      adapter.addEventListener('ended', endedListener)

      eventHandlers.get('ended')?.()

      expect(adapter.getState().playbackState).toBe('ended')
      expect(endedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ended',
        })
      )
    })

    it('should handle timeupdate event', () => {
      const listener = vi.fn()
      adapter.addEventListener('timeupdate', listener)

      Object.defineProperty(mockVideoElement, 'currentTime', { value: 45, writable: true })
      eventHandlers.get('timeupdate')?.()

      expect(adapter.getState().currentTime).toBe(45)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeupdate',
          currentTime: 45,
        })
      )
    })

    it('should handle durationchange event for VOD', () => {
      const listener = vi.fn()
      adapter.addEventListener('durationchange', listener)

      Object.defineProperty(mockVideoElement, 'duration', { value: 3600, writable: true })
      eventHandlers.get('durationchange')?.()

      const state = adapter.getState()
      expect(state.duration).toBe(3600)
      expect(state.isLive).toBe(false)
      expect(state.isSeekable).toBe(true)
    })

    it('should handle durationchange event for live stream', () => {
      const listener = vi.fn()
      adapter.addEventListener('durationchange', listener)

      Object.defineProperty(mockVideoElement, 'duration', { value: Infinity, writable: true })
      eventHandlers.get('durationchange')?.()

      const state = adapter.getState()
      expect(state.duration).toBe(0)
      expect(state.isLive).toBe(true)
      expect(state.isSeekable).toBe(false)
    })

    it('should handle volumechange event', () => {
      const listener = vi.fn()
      adapter.addEventListener('volumechange', listener)

      Object.defineProperty(mockVideoElement, 'volume', { value: 0.7, writable: true })
      Object.defineProperty(mockVideoElement, 'muted', { value: false, writable: true })
      eventHandlers.get('volumechange')?.()

      const state = adapter.getState()
      expect(state.volume).toBe(0.7)
      expect(state.isMuted).toBe(false)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'volumechange',
          volume: 0.7,
          isMuted: false,
        })
      )
    })

    it('should handle waiting event (buffering start)', () => {
      const stateListener = vi.fn()
      const bufferingListener = vi.fn()
      adapter.addEventListener('statechange', stateListener)
      adapter.addEventListener('buffering', bufferingListener)

      eventHandlers.get('waiting')?.()

      expect(adapter.getState().playbackState).toBe('buffering')
      expect(bufferingListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buffering',
          isBuffering: true,
        })
      )
    })

    it('should handle playing event (buffering end)', () => {
      adapter.exposedSetPlaybackState('buffering')
      const bufferingListener = vi.fn()
      adapter.addEventListener('buffering', bufferingListener)

      eventHandlers.get('playing')?.()

      expect(adapter.getState().playbackState).toBe('playing')
      expect(bufferingListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buffering',
          isBuffering: false,
          bufferPercent: 100,
        })
      )
    })

    it('should handle error event with network error', () => {
      const errorListener = vi.fn()
      adapter.addEventListener('error', errorListener)

      Object.defineProperty(mockVideoElement, 'error', {
        value: { code: MEDIA_ERR_NETWORK },
        writable: true,
      })
      eventHandlers.get('error')?.({})

      const state = adapter.getState()
      expect(state.playbackState).toBe('error')
      expect(state.error?.code).toBe('NETWORK_ERROR')
      expect(state.error?.recoverable).toBe(true)
    })

    it('should handle error event with decode error', () => {
      Object.defineProperty(mockVideoElement, 'error', {
        value: { code: MEDIA_ERR_DECODE },
        writable: true,
      })
      eventHandlers.get('error')?.({})

      expect(adapter.getState().error?.code).toBe('DECODE_ERROR')
    })

    it('should handle error event with source not supported', () => {
      Object.defineProperty(mockVideoElement, 'error', {
        value: { code: MEDIA_ERR_SRC_NOT_SUPPORTED },
        writable: true,
      })
      eventHandlers.get('error')?.({})

      expect(adapter.getState().error?.code).toBe('SOURCE_NOT_SUPPORTED')
    })

    it('should handle error event with media aborted', () => {
      Object.defineProperty(mockVideoElement, 'error', {
        value: { code: MEDIA_ERR_ABORTED },
        writable: true,
      })
      eventHandlers.get('error')?.({})

      expect(adapter.getState().error?.code).toBe('MEDIA_ERROR')
    })
  })
})
