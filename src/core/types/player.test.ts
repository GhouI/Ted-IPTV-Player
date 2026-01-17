import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PLAYER_STATE,
  DEFAULT_PLAYER_CONFIG,
  type PlaybackState,
  type StreamType,
  type QualityTrack,
  type AudioTrack,
  type SubtitleTrack,
  type PlayerError,
  type PlayerErrorCode,
  type PlayerState,
  type PlayerEventType,
  type StateChangeEvent,
  type TimeUpdateEvent,
  type DurationChangeEvent,
  type VolumeChangeEvent,
  type QualityChangeEvent,
  type AudioTrackChangeEvent,
  type SubtitleTrackChangeEvent,
  type TracksLoadedEvent,
  type BufferingEvent,
  type ErrorEvent,
  type EndedEvent,
  type PlayerEvent,
  type PlayerConfig,
  type PlayerAdapter,
  type PlayerCapabilities,
} from './player'

describe('Player Types', () => {
  describe('PlaybackState', () => {
    it('should accept valid playback states', () => {
      const states: PlaybackState[] = [
        'idle',
        'loading',
        'buffering',
        'playing',
        'paused',
        'ended',
        'error',
      ]
      expect(states).toHaveLength(7)
    })
  })

  describe('StreamType', () => {
    it('should accept valid stream types', () => {
      const types: StreamType[] = ['hls', 'dash', 'mp4', 'unknown']
      expect(types).toHaveLength(4)
    })
  })

  describe('QualityTrack', () => {
    it('should create a valid quality track', () => {
      const track: QualityTrack = {
        id: 'q-1080p',
        label: '1080p',
        height: 1080,
        width: 1920,
        bitrate: 5000000,
        codec: 'avc1.4d401f',
        frameRate: 30,
      }
      expect(track.id).toBe('q-1080p')
      expect(track.height).toBe(1080)
      expect(track.bitrate).toBe(5000000)
    })

    it('should allow optional fields', () => {
      const track: QualityTrack = {
        id: 'q-720p',
        label: '720p',
        height: 720,
        width: 1280,
        bitrate: 2500000,
      }
      expect(track.codec).toBeUndefined()
      expect(track.frameRate).toBeUndefined()
    })
  })

  describe('AudioTrack', () => {
    it('should create a valid audio track', () => {
      const track: AudioTrack = {
        id: 'a-en',
        label: 'English',
        language: 'en',
        channels: 2,
        codec: 'mp4a.40.2',
        bitrate: 128000,
      }
      expect(track.language).toBe('en')
      expect(track.channels).toBe(2)
    })

    it('should allow optional fields', () => {
      const track: AudioTrack = {
        id: 'a-es',
        label: 'Spanish',
        language: 'es',
      }
      expect(track.channels).toBeUndefined()
      expect(track.codec).toBeUndefined()
    })
  })

  describe('SubtitleTrack', () => {
    it('should create a valid subtitle track', () => {
      const track: SubtitleTrack = {
        id: 's-en-cc',
        label: 'English CC',
        language: 'en',
        isClosedCaption: true,
        mimeType: 'text/vtt',
      }
      expect(track.isClosedCaption).toBe(true)
      expect(track.mimeType).toBe('text/vtt')
    })

    it('should allow optional fields', () => {
      const track: SubtitleTrack = {
        id: 's-es',
        label: 'Spanish',
        language: 'es',
      }
      expect(track.isClosedCaption).toBeUndefined()
    })
  })

  describe('PlayerError', () => {
    it('should create a valid player error', () => {
      const error: PlayerError = {
        code: 'NETWORK_ERROR',
        message: 'Failed to fetch stream',
        recoverable: true,
        timestamp: Date.now(),
      }
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.recoverable).toBe(true)
    })

    it('should include cause when provided', () => {
      const cause = new Error('Original error')
      const error: PlayerError = {
        code: 'MEDIA_ERROR',
        message: 'Media playback failed',
        recoverable: false,
        cause,
        timestamp: Date.now(),
      }
      expect(error.cause).toBe(cause)
    })
  })

  describe('PlayerErrorCode', () => {
    it('should accept all valid error codes', () => {
      const codes: PlayerErrorCode[] = [
        'NETWORK_ERROR',
        'MEDIA_ERROR',
        'DECODE_ERROR',
        'SOURCE_NOT_SUPPORTED',
        'DRM_ERROR',
        'MANIFEST_ERROR',
        'SEGMENT_ERROR',
        'TIMEOUT_ERROR',
        'UNKNOWN_ERROR',
      ]
      expect(codes).toHaveLength(9)
    })
  })

  describe('PlayerState', () => {
    it('should create a valid player state', () => {
      const state: PlayerState = {
        playbackState: 'playing',
        currentTime: 120,
        duration: 3600,
        bufferedTime: 30,
        volume: 0.8,
        isMuted: false,
        isLive: false,
        isSeekable: true,
        currentUrl: 'https://example.com/stream.m3u8',
        streamType: 'hls',
        qualityTracks: [],
        selectedQuality: null,
        isAutoQuality: true,
        audioTracks: [],
        selectedAudioTrack: null,
        subtitleTracks: [],
        selectedSubtitleTrack: null,
        error: null,
      }
      expect(state.playbackState).toBe('playing')
      expect(state.currentTime).toBe(120)
    })
  })

  describe('PlayerEventType', () => {
    it('should accept all valid event types', () => {
      const types: PlayerEventType[] = [
        'statechange',
        'timeupdate',
        'durationchange',
        'volumechange',
        'qualitychange',
        'audiotrackchange',
        'subtitletrackchange',
        'tracksloaded',
        'buffering',
        'error',
        'ended',
      ]
      expect(types).toHaveLength(11)
    })
  })

  describe('Player Events', () => {
    it('should create a valid StateChangeEvent', () => {
      const event: StateChangeEvent = {
        type: 'statechange',
        timestamp: Date.now(),
        previousState: 'loading',
        newState: 'playing',
      }
      expect(event.type).toBe('statechange')
      expect(event.newState).toBe('playing')
    })

    it('should create a valid TimeUpdateEvent', () => {
      const event: TimeUpdateEvent = {
        type: 'timeupdate',
        timestamp: Date.now(),
        currentTime: 60,
        bufferedTime: 90,
      }
      expect(event.type).toBe('timeupdate')
      expect(event.currentTime).toBe(60)
    })

    it('should create a valid DurationChangeEvent', () => {
      const event: DurationChangeEvent = {
        type: 'durationchange',
        timestamp: Date.now(),
        duration: 3600,
        isLive: false,
      }
      expect(event.duration).toBe(3600)
      expect(event.isLive).toBe(false)
    })

    it('should create a valid VolumeChangeEvent', () => {
      const event: VolumeChangeEvent = {
        type: 'volumechange',
        timestamp: Date.now(),
        volume: 0.5,
        isMuted: false,
      }
      expect(event.volume).toBe(0.5)
    })

    it('should create a valid QualityChangeEvent', () => {
      const track: QualityTrack = {
        id: 'q-720p',
        label: '720p',
        height: 720,
        width: 1280,
        bitrate: 2500000,
      }
      const event: QualityChangeEvent = {
        type: 'qualitychange',
        timestamp: Date.now(),
        previousQuality: null,
        newQuality: track,
        isAuto: false,
      }
      expect(event.newQuality).toBe(track)
      expect(event.isAuto).toBe(false)
    })

    it('should create a valid AudioTrackChangeEvent', () => {
      const track: AudioTrack = {
        id: 'a-en',
        label: 'English',
        language: 'en',
      }
      const event: AudioTrackChangeEvent = {
        type: 'audiotrackchange',
        timestamp: Date.now(),
        audioTrack: track,
      }
      expect(event.audioTrack).toBe(track)
    })

    it('should create a valid SubtitleTrackChangeEvent', () => {
      const track: SubtitleTrack = {
        id: 's-en',
        label: 'English',
        language: 'en',
      }
      const event: SubtitleTrackChangeEvent = {
        type: 'subtitletrackchange',
        timestamp: Date.now(),
        subtitleTrack: track,
      }
      expect(event.subtitleTrack).toBe(track)
    })

    it('should create a valid TracksLoadedEvent', () => {
      const event: TracksLoadedEvent = {
        type: 'tracksloaded',
        timestamp: Date.now(),
        qualityTracks: [],
        audioTracks: [],
        subtitleTracks: [],
      }
      expect(event.type).toBe('tracksloaded')
    })

    it('should create a valid BufferingEvent', () => {
      const event: BufferingEvent = {
        type: 'buffering',
        timestamp: Date.now(),
        isBuffering: true,
        bufferPercent: 50,
      }
      expect(event.isBuffering).toBe(true)
      expect(event.bufferPercent).toBe(50)
    })

    it('should create a valid ErrorEvent', () => {
      const event: ErrorEvent = {
        type: 'error',
        timestamp: Date.now(),
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection lost',
          recoverable: true,
          timestamp: Date.now(),
        },
      }
      expect(event.error.code).toBe('NETWORK_ERROR')
    })

    it('should create a valid EndedEvent', () => {
      const event: EndedEvent = {
        type: 'ended',
        timestamp: Date.now(),
      }
      expect(event.type).toBe('ended')
    })

    it('should work with PlayerEvent union type', () => {
      const events: PlayerEvent[] = [
        { type: 'statechange', timestamp: 0, previousState: 'idle', newState: 'loading' },
        { type: 'timeupdate', timestamp: 0, currentTime: 10, bufferedTime: 20 },
        { type: 'ended', timestamp: 0 },
      ]
      expect(events).toHaveLength(3)
      expect(events[0].type).toBe('statechange')
    })
  })

  describe('PlayerConfig', () => {
    it('should create a valid player config with all options', () => {
      const config: PlayerConfig = {
        initialVolume: 0.8,
        startMuted: false,
        autoPlay: true,
        preferredQuality: 720,
        preferredAudioLanguage: 'en',
        preferredSubtitleLanguage: 'es',
        bufferSize: 60,
        retryAttempts: 5,
        retryDelay: 2000,
        lowLatencyMode: true,
      }
      expect(config.preferredQuality).toBe(720)
      expect(config.lowLatencyMode).toBe(true)
    })

    it('should allow auto quality preference', () => {
      const config: PlayerConfig = {
        preferredQuality: 'auto',
      }
      expect(config.preferredQuality).toBe('auto')
    })

    it('should allow all fields to be optional', () => {
      const config: PlayerConfig = {}
      expect(config.initialVolume).toBeUndefined()
    })
  })

  describe('PlayerAdapter interface', () => {
    it('should define all required methods', () => {
      const mockAdapter: PlayerAdapter = {
        initialize: async () => {},
        load: async () => {},
        play: async () => {},
        pause: () => {},
        seek: () => {},
        setVolume: () => {},
        mute: () => {},
        unmute: () => {},
        setQuality: () => {},
        setAudioTrack: () => {},
        setSubtitleTrack: () => {},
        getState: () => DEFAULT_PLAYER_STATE,
        addEventListener: () => {},
        removeEventListener: () => {},
        destroy: async () => {},
      }
      expect(mockAdapter.initialize).toBeDefined()
      expect(mockAdapter.load).toBeDefined()
      expect(mockAdapter.play).toBeDefined()
      expect(mockAdapter.pause).toBeDefined()
      expect(mockAdapter.destroy).toBeDefined()
    })
  })

  describe('PlayerCapabilities', () => {
    it('should create valid capabilities object', () => {
      const capabilities: PlayerCapabilities = {
        mse: true,
        eme: false,
        hls: true,
        dash: true,
        nativeVideo: true,
        supportedVideoCodecs: ['avc1.4d401f', 'hev1.1.6.L93.B0'],
        supportedAudioCodecs: ['mp4a.40.2', 'opus'],
      }
      expect(capabilities.mse).toBe(true)
      expect(capabilities.supportedVideoCodecs).toContain('avc1.4d401f')
    })
  })

  describe('DEFAULT_PLAYER_STATE', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PLAYER_STATE.playbackState).toBe('idle')
      expect(DEFAULT_PLAYER_STATE.currentTime).toBe(0)
      expect(DEFAULT_PLAYER_STATE.duration).toBe(0)
      expect(DEFAULT_PLAYER_STATE.bufferedTime).toBe(0)
      expect(DEFAULT_PLAYER_STATE.volume).toBe(1)
      expect(DEFAULT_PLAYER_STATE.isMuted).toBe(false)
      expect(DEFAULT_PLAYER_STATE.isLive).toBe(false)
      expect(DEFAULT_PLAYER_STATE.isSeekable).toBe(true)
      expect(DEFAULT_PLAYER_STATE.currentUrl).toBeNull()
      expect(DEFAULT_PLAYER_STATE.streamType).toBe('unknown')
      expect(DEFAULT_PLAYER_STATE.qualityTracks).toEqual([])
      expect(DEFAULT_PLAYER_STATE.selectedQuality).toBeNull()
      expect(DEFAULT_PLAYER_STATE.isAutoQuality).toBe(true)
      expect(DEFAULT_PLAYER_STATE.audioTracks).toEqual([])
      expect(DEFAULT_PLAYER_STATE.selectedAudioTrack).toBeNull()
      expect(DEFAULT_PLAYER_STATE.subtitleTracks).toEqual([])
      expect(DEFAULT_PLAYER_STATE.selectedSubtitleTrack).toBeNull()
      expect(DEFAULT_PLAYER_STATE.error).toBeNull()
    })
  })

  describe('DEFAULT_PLAYER_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PLAYER_CONFIG.initialVolume).toBe(1)
      expect(DEFAULT_PLAYER_CONFIG.startMuted).toBe(false)
      expect(DEFAULT_PLAYER_CONFIG.autoPlay).toBe(false)
      expect(DEFAULT_PLAYER_CONFIG.preferredQuality).toBe('auto')
      expect(DEFAULT_PLAYER_CONFIG.preferredAudioLanguage).toBe('en')
      expect(DEFAULT_PLAYER_CONFIG.preferredSubtitleLanguage).toBeNull()
      expect(DEFAULT_PLAYER_CONFIG.bufferSize).toBe(30)
      expect(DEFAULT_PLAYER_CONFIG.retryAttempts).toBe(3)
      expect(DEFAULT_PLAYER_CONFIG.retryDelay).toBe(1000)
      expect(DEFAULT_PLAYER_CONFIG.lowLatencyMode).toBe(false)
    })
  })
})
