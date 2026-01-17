/**
 * Base PlayerAdapter implementation providing common functionality
 * for video playback abstraction. Concrete adapters (Shaka, Native)
 * extend this class to implement specific player logic.
 */

import type {
  PlayerAdapter,
  PlayerState,
  PlayerConfig,
  PlayerEvent,
  PlayerEventType,
  PlayerEventListener,
  PlaybackState,
  StreamType,
  QualityTrack,
  AudioTrack,
  SubtitleTrack,
  PlayerError,
  PlayerErrorCode,
  StateChangeEvent,
  TimeUpdateEvent,
  DurationChangeEvent,
  VolumeChangeEvent,
  QualityChangeEvent,
  AudioTrackChangeEvent,
  SubtitleTrackChangeEvent,
  TracksLoadedEvent,
  BufferingEvent,
  ErrorEvent,
  EndedEvent,
} from '../types/player'
import { DEFAULT_PLAYER_STATE, DEFAULT_PLAYER_CONFIG } from '../types/player'

/**
 * Abstract base class for player adapters
 * Provides common event handling, state management, and utility methods
 */
export abstract class BasePlayerAdapter implements PlayerAdapter {
  /** Video element reference */
  protected videoElement: HTMLVideoElement | null = null

  /** Player configuration */
  protected config: Required<PlayerConfig> = { ...DEFAULT_PLAYER_CONFIG }

  /** Current player state */
  protected state: PlayerState = { ...DEFAULT_PLAYER_STATE }

  /** Event listeners map */
  private eventListeners: Map<PlayerEventType, Set<PlayerEventListener>> = new Map()

  /** Whether the player has been initialized */
  protected initialized = false

  /** Whether the player has been destroyed */
  protected destroyed = false

  /**
   * Initialize the player with a video element
   * Subclasses should call super.initialize() and then perform their own setup
   */
  async initialize(videoElement: HTMLVideoElement, config?: PlayerConfig): Promise<void> {
    if (this.destroyed) {
      throw new Error('Cannot initialize a destroyed player')
    }

    if (this.initialized) {
      throw new Error('Player already initialized')
    }

    this.videoElement = videoElement
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config }
    this.state = { ...DEFAULT_PLAYER_STATE }

    // Apply initial config to video element
    this.videoElement.volume = this.config.initialVolume
    this.videoElement.muted = this.config.startMuted

    // Update state to match config
    this.state.volume = this.config.initialVolume
    this.state.isMuted = this.config.startMuted

    // Attach base video element listeners
    this.attachVideoElementListeners()

    this.initialized = true
  }

  /**
   * Load and optionally start playing a stream
   * Subclasses must implement actual loading logic
   */
  abstract load(url: string, autoPlay?: boolean): Promise<void>

  /**
   * Start or resume playback
   */
  async play(): Promise<void> {
    this.ensureInitialized()

    if (this.videoElement) {
      await this.videoElement.play()
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.ensureInitialized()

    if (this.videoElement) {
      this.videoElement.pause()
    }
  }

  /**
   * Seek to a position in seconds
   */
  seek(time: number): void {
    this.ensureInitialized()

    if (this.videoElement && this.state.isSeekable) {
      const clampedTime = Math.max(0, Math.min(time, this.state.duration || Infinity))
      this.videoElement.currentTime = clampedTime
    }
  }

  /**
   * Set volume level (0-1)
   */
  setVolume(volume: number): void {
    this.ensureInitialized()

    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (this.videoElement) {
      this.videoElement.volume = clampedVolume
    }
  }

  /**
   * Mute audio
   */
  mute(): void {
    this.ensureInitialized()

    if (this.videoElement) {
      this.videoElement.muted = true
    }
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    this.ensureInitialized()

    if (this.videoElement) {
      this.videoElement.muted = false
    }
  }

  /**
   * Select a specific quality track
   * Subclasses should override to implement quality selection
   */
  abstract setQuality(quality: QualityTrack | null): void

  /**
   * Select an audio track
   * Subclasses should override to implement audio track selection
   */
  abstract setAudioTrack(track: AudioTrack): void

  /**
   * Select a subtitle track
   * Subclasses should override to implement subtitle selection
   */
  abstract setSubtitleTrack(track: SubtitleTrack | null): void

  /**
   * Get current player state snapshot
   */
  getState(): PlayerState {
    return { ...this.state }
  }

  /**
   * Add an event listener
   */
  addEventListener<T extends PlayerEventType>(
    type: T,
    listener: PlayerEventListener
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * Remove an event listener
   */
  removeEventListener<T extends PlayerEventType>(
    type: T,
    listener: PlayerEventListener
  ): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Destroy the player and clean up resources
   * Subclasses should call super.destroy() after their own cleanup
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return
    }

    this.detachVideoElementListeners()
    this.eventListeners.clear()
    this.videoElement = null
    this.state = { ...DEFAULT_PLAYER_STATE }
    this.initialized = false
    this.destroyed = true
  }

  // ==========================================================================
  // Protected helper methods for subclasses
  // ==========================================================================

  /**
   * Ensure player is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Player not initialized')
    }
    if (this.destroyed) {
      throw new Error('Player has been destroyed')
    }
  }

  /**
   * Update playback state and emit state change event
   */
  protected setPlaybackState(newState: PlaybackState): void {
    const previousState = this.state.playbackState
    if (previousState !== newState) {
      this.state.playbackState = newState
      this.emitEvent<StateChangeEvent>({
        type: 'statechange',
        timestamp: Date.now(),
        previousState,
        newState,
      })
    }
  }

  /**
   * Update current URL and stream type
   */
  protected setCurrentStream(url: string, streamType: StreamType): void {
    this.state.currentUrl = url
    this.state.streamType = streamType
  }

  /**
   * Update available quality tracks
   */
  protected setQualityTracks(tracks: QualityTrack[]): void {
    this.state.qualityTracks = tracks
  }

  /**
   * Update selected quality track
   */
  protected setSelectedQuality(quality: QualityTrack | null, isAuto: boolean): void {
    const previousQuality = this.state.selectedQuality
    this.state.selectedQuality = quality
    this.state.isAutoQuality = isAuto
    this.emitEvent<QualityChangeEvent>({
      type: 'qualitychange',
      timestamp: Date.now(),
      previousQuality,
      newQuality: quality,
      isAuto,
    })
  }

  /**
   * Update available audio tracks
   */
  protected setAudioTracks(tracks: AudioTrack[]): void {
    this.state.audioTracks = tracks
  }

  /**
   * Update selected audio track
   */
  protected setSelectedAudioTrack(track: AudioTrack): void {
    this.state.selectedAudioTrack = track
    this.emitEvent<AudioTrackChangeEvent>({
      type: 'audiotrackchange',
      timestamp: Date.now(),
      audioTrack: track,
    })
  }

  /**
   * Update available subtitle tracks
   */
  protected setSubtitleTracks(tracks: SubtitleTrack[]): void {
    this.state.subtitleTracks = tracks
  }

  /**
   * Update selected subtitle track
   */
  protected setSelectedSubtitleTrack(track: SubtitleTrack | null): void {
    this.state.selectedSubtitleTrack = track
    this.emitEvent<SubtitleTrackChangeEvent>({
      type: 'subtitletrackchange',
      timestamp: Date.now(),
      subtitleTrack: track,
    })
  }

  /**
   * Emit tracks loaded event
   */
  protected emitTracksLoaded(): void {
    this.emitEvent<TracksLoadedEvent>({
      type: 'tracksloaded',
      timestamp: Date.now(),
      qualityTracks: this.state.qualityTracks,
      audioTracks: this.state.audioTracks,
      subtitleTracks: this.state.subtitleTracks,
    })
  }

  /**
   * Set error state and emit error event
   */
  protected setError(code: PlayerErrorCode, message: string, recoverable: boolean, cause?: Error | unknown): void {
    const error: PlayerError = {
      code,
      message,
      recoverable,
      cause,
      timestamp: Date.now(),
    }
    this.state.error = error
    this.setPlaybackState('error')
    this.emitEvent<ErrorEvent>({
      type: 'error',
      timestamp: Date.now(),
      error,
    })
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.state.error = null
  }

  /**
   * Emit a player event to all registered listeners
   */
  protected emitEvent<T extends PlayerEvent>(event: T): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (err) {
          console.error(`Error in player event listener for "${event.type}":`, err)
        }
      })
    }
  }

  /**
   * Detect stream type from URL
   */
  protected detectStreamType(url: string): StreamType {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
      return 'hls'
    }
    if (lowerUrl.includes('.mpd') || lowerUrl.includes('/dash/')) {
      return 'dash'
    }
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.m4v')) {
      return 'mp4'
    }
    return 'unknown'
  }

  /**
   * Get buffered time ahead of current position
   */
  protected getBufferedAhead(): number {
    if (!this.videoElement) return 0

    const buffered = this.videoElement.buffered
    const currentTime = this.videoElement.currentTime

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
        return buffered.end(i) - currentTime
      }
    }

    return 0
  }

  // ==========================================================================
  // Private video element event handlers
  // ==========================================================================

  private boundHandlers: {
    onPlay: () => void
    onPause: () => void
    onEnded: () => void
    onTimeUpdate: () => void
    onDurationChange: () => void
    onVolumeChange: () => void
    onWaiting: () => void
    onPlaying: () => void
    onError: (e: Event) => void
  } | null = null

  /**
   * Attach listeners to the video element
   */
  private attachVideoElementListeners(): void {
    if (!this.videoElement) return

    this.boundHandlers = {
      onPlay: this.handlePlay.bind(this),
      onPause: this.handlePause.bind(this),
      onEnded: this.handleEnded.bind(this),
      onTimeUpdate: this.handleTimeUpdate.bind(this),
      onDurationChange: this.handleDurationChange.bind(this),
      onVolumeChange: this.handleVolumeChange.bind(this),
      onWaiting: this.handleWaiting.bind(this),
      onPlaying: this.handlePlaying.bind(this),
      onError: this.handleError.bind(this),
    }

    this.videoElement.addEventListener('play', this.boundHandlers.onPlay)
    this.videoElement.addEventListener('pause', this.boundHandlers.onPause)
    this.videoElement.addEventListener('ended', this.boundHandlers.onEnded)
    this.videoElement.addEventListener('timeupdate', this.boundHandlers.onTimeUpdate)
    this.videoElement.addEventListener('durationchange', this.boundHandlers.onDurationChange)
    this.videoElement.addEventListener('volumechange', this.boundHandlers.onVolumeChange)
    this.videoElement.addEventListener('waiting', this.boundHandlers.onWaiting)
    this.videoElement.addEventListener('playing', this.boundHandlers.onPlaying)
    this.videoElement.addEventListener('error', this.boundHandlers.onError)
  }

  /**
   * Detach listeners from the video element
   */
  private detachVideoElementListeners(): void {
    if (!this.videoElement || !this.boundHandlers) return

    this.videoElement.removeEventListener('play', this.boundHandlers.onPlay)
    this.videoElement.removeEventListener('pause', this.boundHandlers.onPause)
    this.videoElement.removeEventListener('ended', this.boundHandlers.onEnded)
    this.videoElement.removeEventListener('timeupdate', this.boundHandlers.onTimeUpdate)
    this.videoElement.removeEventListener('durationchange', this.boundHandlers.onDurationChange)
    this.videoElement.removeEventListener('volumechange', this.boundHandlers.onVolumeChange)
    this.videoElement.removeEventListener('waiting', this.boundHandlers.onWaiting)
    this.videoElement.removeEventListener('playing', this.boundHandlers.onPlaying)
    this.videoElement.removeEventListener('error', this.boundHandlers.onError)

    this.boundHandlers = null
  }

  private handlePlay(): void {
    this.setPlaybackState('playing')
  }

  private handlePause(): void {
    if (this.state.playbackState !== 'ended') {
      this.setPlaybackState('paused')
    }
  }

  private handleEnded(): void {
    this.setPlaybackState('ended')
    this.emitEvent<EndedEvent>({
      type: 'ended',
      timestamp: Date.now(),
    })
  }

  private handleTimeUpdate(): void {
    if (!this.videoElement) return

    this.state.currentTime = this.videoElement.currentTime
    this.state.bufferedTime = this.getBufferedAhead()

    this.emitEvent<TimeUpdateEvent>({
      type: 'timeupdate',
      timestamp: Date.now(),
      currentTime: this.state.currentTime,
      bufferedTime: this.state.bufferedTime,
    })
  }

  private handleDurationChange(): void {
    if (!this.videoElement) return

    const duration = this.videoElement.duration
    const isLive = !isFinite(duration) || duration === Infinity

    this.state.duration = isLive ? 0 : duration
    this.state.isLive = isLive
    this.state.isSeekable = !isLive && duration > 0

    this.emitEvent<DurationChangeEvent>({
      type: 'durationchange',
      timestamp: Date.now(),
      duration: this.state.duration,
      isLive,
    })
  }

  private handleVolumeChange(): void {
    if (!this.videoElement) return

    this.state.volume = this.videoElement.volume
    this.state.isMuted = this.videoElement.muted

    this.emitEvent<VolumeChangeEvent>({
      type: 'volumechange',
      timestamp: Date.now(),
      volume: this.state.volume,
      isMuted: this.state.isMuted,
    })
  }

  private handleWaiting(): void {
    this.setPlaybackState('buffering')
    this.emitEvent<BufferingEvent>({
      type: 'buffering',
      timestamp: Date.now(),
      isBuffering: true,
      bufferPercent: 0,
    })
  }

  private handlePlaying(): void {
    this.setPlaybackState('playing')
    this.emitEvent<BufferingEvent>({
      type: 'buffering',
      timestamp: Date.now(),
      isBuffering: false,
      bufferPercent: 100,
    })
  }

  private handleError(e: Event): void {
    const videoError = this.videoElement?.error
    let code: PlayerErrorCode = 'UNKNOWN_ERROR'
    let message = 'An unknown error occurred'

    if (videoError) {
      // Use numeric constants for MediaError codes (standardized values)
      // MEDIA_ERR_ABORTED = 1, MEDIA_ERR_NETWORK = 2,
      // MEDIA_ERR_DECODE = 3, MEDIA_ERR_SRC_NOT_SUPPORTED = 4
      switch (videoError.code) {
        case 1: // MEDIA_ERR_ABORTED
          code = 'MEDIA_ERROR'
          message = 'Playback was aborted'
          break
        case 2: // MEDIA_ERR_NETWORK
          code = 'NETWORK_ERROR'
          message = 'A network error occurred'
          break
        case 3: // MEDIA_ERR_DECODE
          code = 'DECODE_ERROR'
          message = 'Media decoding failed'
          break
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          code = 'SOURCE_NOT_SUPPORTED'
          message = 'The media source is not supported'
          break
      }
    }

    this.setError(code, message, code === 'NETWORK_ERROR', e)
  }
}
