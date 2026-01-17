/**
 * Tests for NativePlayerAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NativePlayerAdapter } from './NativePlayerAdapter'
import type { PlayerConfig, AudioTrack, SubtitleTrack } from '../types/player'

// Import HTML media type declarations
import '../../types/html-media.d.ts'

// Local type for mock audio track list
interface MockAudioTrack {
  id: string
  label: string
  language: string
  enabled: boolean
  kind: string
  sourceBuffer: null
}

interface MockAudioTrackList {
  length: number
  [index: number]: MockAudioTrack
  getTrackById: (id: string) => MockAudioTrack | null
}

/**
 * Create a mock video element with all necessary properties
 */
function createMockVideoElement(): HTMLVideoElement & {
  triggerEvent: (event: string) => void
  setReadyState: (state: number) => void
} {
  const eventHandlers = new Map<string, Set<() => void>>()

  const element = {
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 0,
    videoWidth: 1920,
    videoHeight: 1080,
    readyState: 0,
    src: '',
    error: null,
    buffered: {
      length: 0,
      start: vi.fn(),
      end: vi.fn(),
    },
    audioTracks: undefined as MockAudioTrackList | undefined,
    textTracks: undefined as TextTrackList | undefined,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set())
      }
      eventHandlers.get(event)!.add(handler)
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      eventHandlers.get(event)?.delete(handler)
    }),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
    canPlayType: vi.fn().mockReturnValue('probably'),
    triggerEvent: (event: string) => {
      eventHandlers.get(event)?.forEach(handler => handler())
    },
    setReadyState: (state: number) => {
      Object.defineProperty(element, 'readyState', { value: state, writable: true })
    },
  }

  return element as unknown as HTMLVideoElement & {
    triggerEvent: (event: string) => void
    setReadyState: (state: number) => void
  }
}

/**
 * Create mock audio tracks list
 */
function createMockAudioTracks(tracks: { id: string; label: string; language: string; enabled: boolean }[]): MockAudioTrackList {
  const list: MockAudioTrack[] = tracks.map((t) => ({
    id: t.id,
    label: t.label,
    language: t.language,
    enabled: t.enabled,
    kind: 'main',
    sourceBuffer: null,
  }))

  const result: MockAudioTrackList = {
    length: list.length,
    getTrackById: (id: string) => list.find(t => t.id === id) || null,
  }

  // Add indexed properties
  list.forEach((track, i) => {
    result[i] = track
  })

  return result
}

/**
 * Create mock text tracks list
 */
function createMockTextTracks(tracks: { label: string; language: string; kind: TextTrackKind; mode: TextTrackMode }[]): TextTrackList {
  const list = tracks.map((t, i) => ({
    label: t.label,
    language: t.language,
    kind: t.kind,
    mode: t.mode,
    id: `text-${i}`,
    cues: null,
    activeCues: null,
    addCue: vi.fn(),
    removeCue: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    oncuechange: null,
  }))

  return {
    length: list.length,
    [Symbol.iterator]: function* () {
      for (const track of list) {
        yield track
      }
    },
    getTrackById: (id: string) => list.find(t => t.id === id) || null,
    ...list.reduce((acc, track, i) => ({ ...acc, [i]: track }), {}),
  } as unknown as TextTrackList
}

describe('NativePlayerAdapter', () => {
  let adapter: NativePlayerAdapter
  let mockVideoElement: ReturnType<typeof createMockVideoElement>

  beforeEach(() => {
    adapter = new NativePlayerAdapter()
    mockVideoElement = createMockVideoElement()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    try {
      await adapter.destroy()
    } catch {
      // Ignore errors during cleanup
    }
  })

  describe('initialize', () => {
    it('should initialize with video element', async () => {
      await adapter.initialize(mockVideoElement)

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
    })

    it('should attach video element event listeners', async () => {
      await adapter.initialize(mockVideoElement)

      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('play', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function))
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
    })
  })

  describe('load', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should load a stream URL and set src on video element', async () => {
      // Pre-set readyState so loadedmetadata resolves immediately
      mockVideoElement.setReadyState(1)

      await adapter.load('http://example.com/video.mp4')

      expect(mockVideoElement.src).toBe('http://example.com/video.mp4')
      expect(adapter.getState().currentUrl).toBe('http://example.com/video.mp4')
    })

    it('should detect MP4 stream type', async () => {
      mockVideoElement.setReadyState(1)

      await adapter.load('http://example.com/video.mp4')

      expect(adapter.getState().streamType).toBe('mp4')
    })

    it('should detect HLS stream type for native HLS playback', async () => {
      mockVideoElement.setReadyState(1)

      await adapter.load('http://example.com/stream.m3u8')

      expect(adapter.getState().streamType).toBe('hls')
    })

    it('should wait for metadata to be loaded', async () => {
      let loadedMetadataCallback: (() => void) | undefined

      mockVideoElement.addEventListener = vi.fn((event: string, handler: () => void) => {
        if (event === 'loadedmetadata') {
          loadedMetadataCallback = handler
        }
      })

      // Reinitialize to get fresh event handlers
      adapter = new NativePlayerAdapter()
      await adapter.initialize(mockVideoElement)

      const loadPromise = adapter.load('http://example.com/video.mp4')

      // Simulate metadata loaded
      setTimeout(() => {
        mockVideoElement.setReadyState(1)
        loadedMetadataCallback?.()
      }, 10)

      await loadPromise

      expect(adapter.getState().playbackState).toBe('paused')
    })

    it('should auto-play when autoPlay is true', async () => {
      mockVideoElement.setReadyState(1)

      await adapter.load('http://example.com/video.mp4', true)

      expect(mockVideoElement.play).toHaveBeenCalled()
    })

    it('should emit tracksloaded event', async () => {
      mockVideoElement.setReadyState(1)
      const listener = vi.fn()
      adapter.addEventListener('tracksloaded', listener)

      await adapter.load('http://example.com/video.mp4')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tracksloaded',
        })
      )
    })

    it('should extract quality tracks from video dimensions', async () => {
      mockVideoElement.setReadyState(1)
      Object.defineProperty(mockVideoElement, 'videoWidth', { value: 1920, writable: true })
      Object.defineProperty(mockVideoElement, 'videoHeight', { value: 1080, writable: true })

      await adapter.load('http://example.com/video.mp4')

      const state = adapter.getState()
      expect(state.qualityTracks).toHaveLength(1)
      expect(state.qualityTracks[0]).toEqual(
        expect.objectContaining({
          id: 'native',
          label: '1080p',
          height: 1080,
          width: 1920,
        })
      )
    })

    it('should handle load error', async () => {
      let errorCallback: (() => void) | undefined

      mockVideoElement.addEventListener = vi.fn((event: string, handler: () => void) => {
        if (event === 'error') {
          errorCallback = handler
        }
      })

      adapter = new NativePlayerAdapter()
      await adapter.initialize(mockVideoElement)

      const loadPromise = adapter.load('http://example.com/invalid.mp4')

      // Simulate error
      setTimeout(() => {
        Object.defineProperty(mockVideoElement, 'error', {
          value: { message: 'Load failed' },
          writable: true,
        })
        errorCallback?.()
      }, 10)

      await expect(loadPromise).rejects.toThrow()
    })

    it('should throw if not initialized', async () => {
      const newAdapter = new NativePlayerAdapter()

      await expect(newAdapter.load('http://example.com/video.mp4')).rejects.toThrow('Player not initialized')
    })

    it('should set loading state while loading', async () => {
      const stateListener = vi.fn()
      adapter.addEventListener('statechange', stateListener)

      // Start load but don't complete it yet
      mockVideoElement.setReadyState(0)

      const loadPromise = adapter.load('http://example.com/video.mp4')

      // Should immediately be in loading state
      expect(stateListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'statechange',
          newState: 'loading',
        })
      )

      // Complete the load
      mockVideoElement.setReadyState(1)
      mockVideoElement.triggerEvent('loadedmetadata')
      await loadPromise
    })
  })

  describe('setQuality', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should be a no-op for native player (no adaptive streaming)', () => {
      const qualityTrack = {
        id: '1080p',
        label: '1080p',
        height: 1080,
        width: 1920,
        bitrate: 5000000,
      }

      // Should not throw
      adapter.setQuality(qualityTrack)
      adapter.setQuality(null)
    })
  })

  describe('setAudioTrack', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should enable the selected audio track', async () => {
      const mockAudioTracks = createMockAudioTracks([
        { id: 'en', label: 'English', language: 'en', enabled: true },
        { id: 'es', label: 'Spanish', language: 'es', enabled: false },
      ])

      Object.defineProperty(mockVideoElement, 'audioTracks', {
        value: mockAudioTracks,
        writable: true,
      })

      const track: AudioTrack = { id: 'es', label: 'Spanish', language: 'es' }
      adapter.setAudioTrack(track)

      // Verify the correct track was enabled
      expect(adapter.getState().selectedAudioTrack).toEqual(track)
    })

    it('should emit audiotrackchange event', async () => {
      const mockAudioTracks = createMockAudioTracks([
        { id: 'en', label: 'English', language: 'en', enabled: true },
      ])

      Object.defineProperty(mockVideoElement, 'audioTracks', {
        value: mockAudioTracks,
        writable: true,
      })

      const listener = vi.fn()
      adapter.addEventListener('audiotrackchange', listener)

      const track: AudioTrack = { id: 'en', label: 'English', language: 'en' }
      adapter.setAudioTrack(track)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audiotrackchange',
          audioTrack: track,
        })
      )
    })
  })

  describe('setSubtitleTrack', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should enable the selected subtitle track', async () => {
      const mockTextTracks = createMockTextTracks([
        { label: 'English', language: 'en', kind: 'subtitles', mode: 'disabled' },
        { label: 'Spanish', language: 'es', kind: 'subtitles', mode: 'disabled' },
      ])

      Object.defineProperty(mockVideoElement, 'textTracks', {
        value: mockTextTracks,
        writable: true,
      })

      const track: SubtitleTrack = { id: 'Spanish', label: 'Spanish', language: 'es' }
      adapter.setSubtitleTrack(track)

      // Verify the track mode was set
      expect((mockTextTracks[1] as TextTrack).mode).toBe('showing')
    })

    it('should disable all tracks when set to null', async () => {
      const mockTextTracks = createMockTextTracks([
        { label: 'English', language: 'en', kind: 'subtitles', mode: 'showing' },
      ])

      Object.defineProperty(mockVideoElement, 'textTracks', {
        value: mockTextTracks,
        writable: true,
      })

      adapter.setSubtitleTrack(null)

      expect((mockTextTracks[0] as TextTrack).mode).toBe('disabled')
      expect(adapter.getState().selectedSubtitleTrack).toBeNull()
    })

    it('should emit subtitletrackchange event', async () => {
      const mockTextTracks = createMockTextTracks([
        { label: 'English', language: 'en', kind: 'subtitles', mode: 'disabled' },
      ])

      Object.defineProperty(mockVideoElement, 'textTracks', {
        value: mockTextTracks,
        writable: true,
      })

      const listener = vi.fn()
      adapter.addEventListener('subtitletrackchange', listener)

      const track: SubtitleTrack = { id: 'English', label: 'English', language: 'en' }
      adapter.setSubtitleTrack(track)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'subtitletrackchange',
          subtitleTrack: track,
        })
      )
    })
  })

  describe('addSubtitleTrack', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should add a track element to the video', () => {
      adapter.addSubtitleTrack('http://example.com/subs.vtt', 'en', 'English')

      expect(mockVideoElement.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'subtitles',
          src: 'http://example.com/subs.vtt',
          srclang: 'en',
          label: 'English',
        })
      )
    })
  })

  describe('track extraction', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should extract audio tracks from video element', async () => {
      const mockAudioTracks = createMockAudioTracks([
        { id: 'en', label: 'English', language: 'en', enabled: true },
        { id: 'es', label: 'Spanish', language: 'es', enabled: false },
      ])

      Object.defineProperty(mockVideoElement, 'audioTracks', {
        value: mockAudioTracks,
        writable: true,
      })

      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')

      const state = adapter.getState()
      expect(state.audioTracks).toHaveLength(2)
      expect(state.selectedAudioTrack).toEqual(
        expect.objectContaining({ id: 'en', label: 'English' })
      )
    })

    it('should create default audio track when none available', async () => {
      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')

      const state = adapter.getState()
      expect(state.audioTracks).toHaveLength(1)
      expect(state.audioTracks[0].id).toBe('default')
    })

    it('should extract subtitle tracks from video element', async () => {
      const mockTextTracks = createMockTextTracks([
        { label: 'English', language: 'en', kind: 'subtitles', mode: 'disabled' },
        { label: 'English CC', language: 'en', kind: 'captions', mode: 'disabled' },
      ])

      Object.defineProperty(mockVideoElement, 'textTracks', {
        value: mockTextTracks,
        writable: true,
      })

      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')

      const state = adapter.getState()
      expect(state.subtitleTracks).toHaveLength(2)
      expect(state.subtitleTracks[1].isClosedCaption).toBe(true)
    })

    it('should ignore non-subtitle text tracks', async () => {
      const mockTextTracks = createMockTextTracks([
        { label: 'English', language: 'en', kind: 'subtitles', mode: 'disabled' },
        { label: 'Chapters', language: '', kind: 'chapters', mode: 'disabled' },
      ])

      Object.defineProperty(mockVideoElement, 'textTracks', {
        value: mockTextTracks,
        writable: true,
      })

      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')

      const state = adapter.getState()
      expect(state.subtitleTracks).toHaveLength(1)
    })
  })

  describe('destroy', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should clean up resources', async () => {
      await adapter.destroy()

      expect(mockVideoElement.removeAttribute).toHaveBeenCalledWith('src')
      expect(mockVideoElement.load).toHaveBeenCalled()
    })

    it('should remove added track elements', async () => {
      const mockTrackElement = {
        kind: 'subtitles',
        src: '',
        srclang: '',
        label: '',
        remove: vi.fn(),
      }

      // Mock document.createElement to return our mock element
      const originalCreateElement = document.createElement
      document.createElement = vi.fn().mockReturnValue(mockTrackElement)

      adapter.addSubtitleTrack('http://example.com/subs.vtt', 'en', 'English')

      await adapter.destroy()

      expect(mockTrackElement.remove).toHaveBeenCalled()

      document.createElement = originalCreateElement
    })

    it('should be idempotent', async () => {
      await adapter.destroy()
      await adapter.destroy()

      // Should not throw
    })
  })

  describe('playback controls', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')
    })

    it('should call play on video element', async () => {
      await adapter.play()

      expect(mockVideoElement.play).toHaveBeenCalled()
    })

    it('should call pause on video element', () => {
      adapter.pause()

      expect(mockVideoElement.pause).toHaveBeenCalled()
    })

    it('should set volume on video element', () => {
      adapter.setVolume(0.5)

      expect(mockVideoElement.volume).toBe(0.5)
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

  describe('state management', () => {
    beforeEach(async () => {
      await adapter.initialize(mockVideoElement)
    })

    it('should return a copy of state', () => {
      const state1 = adapter.getState()
      const state2 = adapter.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })

    it('should handle video element events', async () => {
      mockVideoElement.setReadyState(1)
      await adapter.load('http://example.com/video.mp4')

      // Trigger play event
      mockVideoElement.triggerEvent('play')
      expect(adapter.getState().playbackState).toBe('playing')

      // Trigger pause event
      mockVideoElement.triggerEvent('pause')
      expect(adapter.getState().playbackState).toBe('paused')
    })
  })
})
