import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './playerStore'
import type { QualityTrack, AudioTrack, SubtitleTrack, PlayerError } from '../types/player'

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = usePlayerStore.getState()

      expect(state.playbackState).toBe('idle')
      expect(state.currentTime).toBe(0)
      expect(state.duration).toBe(0)
      expect(state.bufferedTime).toBe(0)
      expect(state.volume).toBe(1)
      expect(state.isMuted).toBe(false)
      expect(state.isLive).toBe(false)
      expect(state.isSeekable).toBe(true)
      expect(state.currentUrl).toBeNull()
      expect(state.streamType).toBe('unknown')
      expect(state.qualityTracks).toEqual([])
      expect(state.selectedQuality).toBeNull()
      expect(state.isAutoQuality).toBe(true)
      expect(state.audioTracks).toEqual([])
      expect(state.selectedAudioTrack).toBeNull()
      expect(state.subtitleTracks).toEqual([])
      expect(state.selectedSubtitleTrack).toBeNull()
      expect(state.error).toBeNull()
      expect(state.controlsVisible).toBe(true)
      expect(state.isFullscreen).toBe(false)
    })
  })

  describe('playback state', () => {
    it('should set playback state', () => {
      const { setPlaybackState } = usePlayerStore.getState()

      setPlaybackState('playing')
      expect(usePlayerStore.getState().playbackState).toBe('playing')

      setPlaybackState('paused')
      expect(usePlayerStore.getState().playbackState).toBe('paused')

      setPlaybackState('buffering')
      expect(usePlayerStore.getState().playbackState).toBe('buffering')
    })

    it('should report playing correctly', () => {
      const { setPlaybackState, isPlaying } = usePlayerStore.getState()

      expect(isPlaying()).toBe(false)

      setPlaybackState('playing')
      expect(usePlayerStore.getState().isPlaying()).toBe(true)

      setPlaybackState('paused')
      expect(usePlayerStore.getState().isPlaying()).toBe(false)
    })

    it('should report buffering correctly', () => {
      const { setPlaybackState, isBuffering } = usePlayerStore.getState()

      expect(isBuffering()).toBe(false)

      setPlaybackState('loading')
      expect(usePlayerStore.getState().isBuffering()).toBe(true)

      setPlaybackState('buffering')
      expect(usePlayerStore.getState().isBuffering()).toBe(true)

      setPlaybackState('playing')
      expect(usePlayerStore.getState().isBuffering()).toBe(false)
    })
  })

  describe('time and duration', () => {
    it('should set current time', () => {
      const { setCurrentTime } = usePlayerStore.getState()

      setCurrentTime(30.5)
      expect(usePlayerStore.getState().currentTime).toBe(30.5)
    })

    it('should set duration and detect live streams', () => {
      const { setDuration } = usePlayerStore.getState()

      setDuration(3600)
      expect(usePlayerStore.getState().duration).toBe(3600)
      expect(usePlayerStore.getState().isLive).toBe(false)
      expect(usePlayerStore.getState().isSeekable).toBe(true)

      setDuration(0, true)
      expect(usePlayerStore.getState().duration).toBe(0)
      expect(usePlayerStore.getState().isLive).toBe(true)
      expect(usePlayerStore.getState().isSeekable).toBe(false)
    })

    it('should set buffered time', () => {
      const { setBufferedTime } = usePlayerStore.getState()

      setBufferedTime(60)
      expect(usePlayerStore.getState().bufferedTime).toBe(60)
    })

    it('should calculate progress percent', () => {
      const { setCurrentTime, setDuration, getProgressPercent } = usePlayerStore.getState()

      expect(getProgressPercent()).toBe(0)

      setDuration(100)
      setCurrentTime(25)
      expect(usePlayerStore.getState().getProgressPercent()).toBe(25)

      setCurrentTime(50)
      expect(usePlayerStore.getState().getProgressPercent()).toBe(50)
    })

    it('should calculate buffer percent', () => {
      const { setBufferedTime, setDuration, getBufferPercent } = usePlayerStore.getState()

      expect(getBufferPercent()).toBe(0)

      setDuration(200)
      setBufferedTime(100)
      expect(usePlayerStore.getState().getBufferPercent()).toBe(50)
    })
  })

  describe('volume control', () => {
    it('should set volume within valid range', () => {
      const { setVolume } = usePlayerStore.getState()

      setVolume(0.5)
      expect(usePlayerStore.getState().volume).toBe(0.5)

      // Test clamping
      setVolume(1.5)
      expect(usePlayerStore.getState().volume).toBe(1)

      setVolume(-0.5)
      expect(usePlayerStore.getState().volume).toBe(0)
    })

    it('should toggle mute', () => {
      const { toggleMute } = usePlayerStore.getState()

      expect(usePlayerStore.getState().isMuted).toBe(false)

      toggleMute()
      expect(usePlayerStore.getState().isMuted).toBe(true)

      toggleMute()
      expect(usePlayerStore.getState().isMuted).toBe(false)
    })

    it('should set muted directly', () => {
      const { setMuted } = usePlayerStore.getState()

      setMuted(true)
      expect(usePlayerStore.getState().isMuted).toBe(true)

      setMuted(false)
      expect(usePlayerStore.getState().isMuted).toBe(false)
    })

    it('should calculate volume percent', () => {
      const { setVolume, getVolumePercent } = usePlayerStore.getState()

      expect(getVolumePercent()).toBe(100)

      setVolume(0.75)
      expect(usePlayerStore.getState().getVolumePercent()).toBe(75)

      setVolume(0.333)
      expect(usePlayerStore.getState().getVolumePercent()).toBe(33)
    })
  })

  describe('stream URL', () => {
    it('should set current URL and reset state', () => {
      const { setCurrentUrl, setCurrentTime, setPlaybackState } = usePlayerStore.getState()

      setPlaybackState('playing')
      setCurrentTime(100)

      setCurrentUrl('http://example.com/stream.m3u8', 'hls')

      const state = usePlayerStore.getState()
      expect(state.currentUrl).toBe('http://example.com/stream.m3u8')
      expect(state.streamType).toBe('hls')
      expect(state.playbackState).toBe('loading')
      expect(state.currentTime).toBe(0)
      expect(state.error).toBeNull()
    })

    it('should handle null URL', () => {
      const { setCurrentUrl } = usePlayerStore.getState()

      setCurrentUrl('http://example.com/stream.mpd', 'dash')
      setCurrentUrl(null)

      const state = usePlayerStore.getState()
      expect(state.currentUrl).toBeNull()
      expect(state.playbackState).toBe('idle')
    })
  })

  describe('quality tracks', () => {
    const mockQualityTracks: QualityTrack[] = [
      { id: '1080p', label: '1080p', height: 1080, width: 1920, bitrate: 5000000 },
      { id: '720p', label: '720p', height: 720, width: 1280, bitrate: 2500000 },
      { id: '480p', label: '480p', height: 480, width: 854, bitrate: 1000000 },
    ]

    it('should set quality tracks', () => {
      const { setQualityTracks } = usePlayerStore.getState()

      setQualityTracks(mockQualityTracks)
      expect(usePlayerStore.getState().qualityTracks).toEqual(mockQualityTracks)
    })

    it('should select quality and disable auto', () => {
      const { setQualityTracks, selectQuality } = usePlayerStore.getState()

      setQualityTracks(mockQualityTracks)
      selectQuality(mockQualityTracks[0])

      const state = usePlayerStore.getState()
      expect(state.selectedQuality).toEqual(mockQualityTracks[0])
      expect(state.isAutoQuality).toBe(false)
    })

    it('should enable auto quality', () => {
      const { setQualityTracks, selectQuality, enableAutoQuality } = usePlayerStore.getState()

      setQualityTracks(mockQualityTracks)
      selectQuality(mockQualityTracks[0])
      enableAutoQuality()

      const state = usePlayerStore.getState()
      expect(state.selectedQuality).toBeNull()
      expect(state.isAutoQuality).toBe(true)
    })

    it('should get current quality label', () => {
      const { setQualityTracks, selectQuality, getCurrentQualityLabel } = usePlayerStore.getState()

      expect(getCurrentQualityLabel()).toBe('Auto')

      setQualityTracks(mockQualityTracks)
      selectQuality(mockQualityTracks[1])

      expect(usePlayerStore.getState().getCurrentQualityLabel()).toBe('720p')
    })
  })

  describe('audio tracks', () => {
    const mockAudioTracks: AudioTrack[] = [
      { id: 'en', label: 'English', language: 'en', channels: 2 },
      { id: 'es', label: 'Spanish', language: 'es', channels: 2 },
    ]

    it('should set audio tracks', () => {
      const { setAudioTracks } = usePlayerStore.getState()

      setAudioTracks(mockAudioTracks)
      expect(usePlayerStore.getState().audioTracks).toEqual(mockAudioTracks)
    })

    it('should select audio track', () => {
      const { setAudioTracks, selectAudioTrack } = usePlayerStore.getState()

      setAudioTracks(mockAudioTracks)
      selectAudioTrack(mockAudioTracks[1])

      expect(usePlayerStore.getState().selectedAudioTrack).toEqual(mockAudioTracks[1])
    })
  })

  describe('subtitle tracks', () => {
    const mockSubtitleTracks: SubtitleTrack[] = [
      { id: 'en-sub', label: 'English', language: 'en' },
      { id: 'es-sub', label: 'Spanish', language: 'es' },
    ]

    it('should set subtitle tracks', () => {
      const { setSubtitleTracks } = usePlayerStore.getState()

      setSubtitleTracks(mockSubtitleTracks)
      expect(usePlayerStore.getState().subtitleTracks).toEqual(mockSubtitleTracks)
    })

    it('should select subtitle track', () => {
      const { setSubtitleTracks, selectSubtitleTrack } = usePlayerStore.getState()

      setSubtitleTracks(mockSubtitleTracks)
      selectSubtitleTrack(mockSubtitleTracks[0])

      expect(usePlayerStore.getState().selectedSubtitleTrack).toEqual(mockSubtitleTracks[0])
    })

    it('should disable subtitles with null', () => {
      const { setSubtitleTracks, selectSubtitleTrack } = usePlayerStore.getState()

      setSubtitleTracks(mockSubtitleTracks)
      selectSubtitleTrack(mockSubtitleTracks[0])
      selectSubtitleTrack(null)

      expect(usePlayerStore.getState().selectedSubtitleTrack).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should set error and update playback state', () => {
      const { setPlaybackState, setError } = usePlayerStore.getState()

      setPlaybackState('playing')

      const error: PlayerError = {
        code: 'NETWORK_ERROR',
        message: 'Connection lost',
        recoverable: true,
        timestamp: Date.now(),
      }

      setError(error)

      const state = usePlayerStore.getState()
      expect(state.error).toEqual(error)
      expect(state.playbackState).toBe('error')
    })

    it('should clear error', () => {
      const { setError, setPlaybackState } = usePlayerStore.getState()

      const error: PlayerError = {
        code: 'MEDIA_ERROR',
        message: 'Media decode failed',
        recoverable: false,
        timestamp: Date.now(),
      }

      setError(error)
      setPlaybackState('loading')
      setError(null)

      expect(usePlayerStore.getState().error).toBeNull()
    })
  })

  describe('UI state', () => {
    it('should show and hide controls', () => {
      const { showControls, hideControls } = usePlayerStore.getState()

      expect(usePlayerStore.getState().controlsVisible).toBe(true)

      hideControls()
      expect(usePlayerStore.getState().controlsVisible).toBe(false)

      showControls()
      expect(usePlayerStore.getState().controlsVisible).toBe(true)
    })

    it('should set fullscreen state', () => {
      const { setFullscreen } = usePlayerStore.getState()

      expect(usePlayerStore.getState().isFullscreen).toBe(false)

      setFullscreen(true)
      expect(usePlayerStore.getState().isFullscreen).toBe(true)

      setFullscreen(false)
      expect(usePlayerStore.getState().isFullscreen).toBe(false)
    })

    it('should set seekable state', () => {
      const { setSeekable } = usePlayerStore.getState()

      expect(usePlayerStore.getState().isSeekable).toBe(true)

      setSeekable(false)
      expect(usePlayerStore.getState().isSeekable).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = usePlayerStore.getState()

      // Modify various state
      store.setPlaybackState('playing')
      store.setCurrentTime(100)
      store.setDuration(3600)
      store.setVolume(0.5)
      store.setMuted(true)
      store.setCurrentUrl('http://example.com/stream.m3u8', 'hls')
      store.setQualityTracks([{ id: '1080p', label: '1080p', height: 1080, width: 1920, bitrate: 5000000 }])
      store.hideControls()
      store.setFullscreen(true)

      // Reset
      store.reset()

      // Verify reset
      const state = usePlayerStore.getState()
      expect(state.playbackState).toBe('idle')
      expect(state.currentTime).toBe(0)
      expect(state.duration).toBe(0)
      expect(state.volume).toBe(1)
      expect(state.isMuted).toBe(false)
      expect(state.currentUrl).toBeNull()
      expect(state.qualityTracks).toEqual([])
      expect(state.controlsVisible).toBe(true)
      expect(state.isFullscreen).toBe(false)
    })
  })
})
