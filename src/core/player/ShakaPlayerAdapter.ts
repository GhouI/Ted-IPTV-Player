/**
 * Shaka Player adapter for HLS and DASH streaming
 *
 * Uses Shaka Player library for adaptive bitrate streaming via MSE.
 * Provides HLS and DASH playback with quality selection and track management.
 */

import { BasePlayerAdapter } from './BasePlayerAdapter'
import type {
  QualityTrack,
  AudioTrack,
  SubtitleTrack,
  PlayerConfig,
  StreamType,
} from '../types/player'
import type { Player as ShakaPlayerType } from 'shaka-player'

// Type for the Shaka module
interface ShakaModule {
  Player: {
    new(): ShakaPlayerType
    isBrowserSupported(): boolean
  }
  polyfill: {
    installAll(): void
  }
}

/** Cached Shaka Player module */
let shakaModule: ShakaModule | null = null

/**
 * Dynamically load Shaka Player library
 */
async function loadShakaPlayer(): Promise<ShakaModule> {
  if (shakaModule) {
    return shakaModule
  }

  try {
    const module = await import('shaka-player')
    shakaModule = module as unknown as ShakaModule
    return shakaModule
  } catch {
    throw new Error('Failed to load Shaka Player library')
  }
}

/**
 * Check if Shaka Player is available and browser is supported
 */
export async function isShakaSupported(): Promise<boolean> {
  try {
    const shaka = await loadShakaPlayer()
    return shaka.Player.isBrowserSupported()
  } catch {
    return false
  }
}

/**
 * ShakaPlayerAdapter - Adaptive streaming player using Shaka Player
 *
 * This adapter is used for:
 * - HLS streams (via MSE transmuxing)
 * - DASH/MPEG-DASH streams
 * - Adaptive bitrate streaming with quality selection
 * - Multi-audio and subtitle track support
 */
export class ShakaPlayerAdapter extends BasePlayerAdapter {
  /** Shaka Player instance */
  private player: ShakaPlayerType | null = null

  /** Reference to Shaka module */
  private shaka: ShakaModule | null = null

  /**
   * Initialize the Shaka player
   */
  async initialize(videoElement: HTMLVideoElement, config?: PlayerConfig): Promise<void> {
    await super.initialize(videoElement, config)

    try {
      // Load Shaka Player dynamically
      this.shaka = await loadShakaPlayer()

      // Check browser support
      if (!this.shaka.Player.isBrowserSupported()) {
        throw new Error('Browser does not support Shaka Player')
      }

      // Install polyfills if needed
      this.shaka.polyfill.installAll()

      // Create player instance
      this.player = new this.shaka.Player()
      await this.player.attach(videoElement)

      // Configure player
      this.configurePlayer()

      // Set up event listeners
      this.attachShakaEventListeners()

    } catch (error) {
      this.setError(
        'MEDIA_ERROR',
        'Failed to initialize Shaka Player',
        false,
        error
      )
      throw error
    }
  }

  /**
   * Configure Shaka Player with app settings
   */
  private configurePlayer(): void {
    if (!this.player) return

    this.player.configure({
      streaming: {
        bufferingGoal: this.config.bufferSize,
        rebufferingGoal: Math.min(this.config.bufferSize / 3, 10),
        bufferBehind: 30,
        retryParameters: {
          maxAttempts: this.config.retryAttempts,
          baseDelay: this.config.retryDelay,
          backoffFactor: 2,
          fuzzFactor: 0.5,
        },
      },
      abr: {
        enabled: this.config.preferredQuality === 'auto',
      },
    })

    // Set preferred audio language if specified
    if (this.config.preferredAudioLanguage) {
      this.player.configure('preferredAudioLanguage', this.config.preferredAudioLanguage)
    }

    // Set preferred subtitle language if specified
    if (this.config.preferredSubtitleLanguage) {
      this.player.configure('preferredTextLanguage', this.config.preferredSubtitleLanguage)
    }
  }

  /**
   * Attach Shaka-specific event listeners
   */
  private attachShakaEventListeners(): void {
    if (!this.player) return

    // Error event
    this.player.addEventListener('error', (event: Event) => {
      const shakaEvent = event as unknown as { detail: unknown }
      const detail = shakaEvent.detail as { code?: number; message?: string; severity?: number } | undefined
      this.handleShakaError(detail)
    })

    // Adaptation event (quality change)
    this.player.addEventListener('adaptation', () => {
      this.updateQualityTracks()
    })

    // Variant change (quality/audio track change)
    this.player.addEventListener('variantchanged', () => {
      this.updateQualityTracks()
      this.updateAudioTracks()
    })

    // Text track change
    this.player.addEventListener('textchanged', () => {
      this.updateSubtitleTracks()
    })

    // Tracks loaded
    this.player.addEventListener('trackschanged', () => {
      this.updateAllTracks()
      this.emitTracksLoaded()
    })
  }

  /**
   * Handle Shaka Player errors
   */
  private handleShakaError(detail?: { code?: number; message?: string; severity?: number }): void {
    const code = detail?.code
    const message = detail?.message || 'Shaka Player error'
    const severity = detail?.severity || 2

    // Map Shaka error codes to our error codes
    const errorCode = this.mapShakaErrorCode(code)
    const recoverable = severity < 2 // Severity 1 is recoverable

    this.setError(errorCode, message, recoverable, detail)
  }

  /**
   * Map Shaka error code to PlayerErrorCode
   */
  private mapShakaErrorCode(code?: number): import('../types/player').PlayerErrorCode {
    if (!code) return 'UNKNOWN_ERROR'

    // Shaka error code ranges:
    // 1000-1999: Network errors
    // 2000-2999: Text errors
    // 3000-3999: Media errors
    // 4000-4999: Manifest errors
    // 5000-5999: Streaming errors
    // 6000-6999: DRM errors

    if (code >= 1000 && code < 2000) return 'NETWORK_ERROR'
    if (code >= 3000 && code < 4000) return 'DECODE_ERROR'
    if (code >= 4000 && code < 5000) return 'MANIFEST_ERROR'
    if (code >= 5000 && code < 6000) return 'SEGMENT_ERROR'
    if (code >= 6000 && code < 7000) return 'DRM_ERROR'

    return 'UNKNOWN_ERROR'
  }

  /**
   * Load a stream URL
   */
  async load(url: string, autoPlay = false): Promise<void> {
    this.ensureInitialized()

    if (!this.player) {
      throw new Error('Shaka Player not initialized')
    }

    // Clear any previous error
    this.clearError()

    // Set loading state
    this.setPlaybackState('loading')

    // Detect stream type
    const streamType = this.detectStreamType(url)
    this.setCurrentStream(url, streamType)

    try {
      // Load the manifest
      await this.player.load(url)

      // Update all track information
      this.updateAllTracks()

      // Apply preferred quality if not auto
      if (typeof this.config.preferredQuality === 'number') {
        const preferredTrack = this.state.qualityTracks.find(
          t => t.height === this.config.preferredQuality
        )
        if (preferredTrack) {
          this.setQuality(preferredTrack)
        }
      }

      // Emit tracks loaded event
      this.emitTracksLoaded()

      // Set to paused state (ready to play)
      this.setPlaybackState('paused')

      // Auto-play if requested
      if (autoPlay || this.config.autoPlay) {
        await this.play()
      }
    } catch (error) {
      this.setError(
        'MEDIA_ERROR',
        'Failed to load stream',
        true,
        error
      )
      throw error
    }
  }

  /**
   * Override stream type detection for Shaka-specific handling
   */
  protected detectStreamType(url: string): StreamType {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/')) {
      return 'hls'
    }
    if (lowerUrl.includes('.mpd') || lowerUrl.includes('/dash/')) {
      return 'dash'
    }
    return super.detectStreamType(url)
  }

  /**
   * Set quality track
   */
  setQuality(quality: QualityTrack | null): void {
    this.ensureInitialized()

    if (!this.player) return

    if (quality === null) {
      // Enable ABR (auto quality)
      this.player.configure('abr.enabled', true)
      this.setSelectedQuality(null, true)
    } else {
      // Disable ABR and select specific variant
      this.player.configure('abr.enabled', false)

      const variants = this.player.getVariantTracks()
      const matchingVariant = variants.find(
        v => v.height === quality.height && v.width === quality.width
      )

      if (matchingVariant) {
        this.player.selectVariantTrack(matchingVariant, /* clearBuffer */ true)
        this.setSelectedQuality(quality, false)
      }
    }
  }

  /**
   * Set audio track
   */
  setAudioTrack(track: AudioTrack): void {
    this.ensureInitialized()

    if (!this.player) return

    const variants = this.player.getVariantTracks()
    const matchingVariant = variants.find(
      v => v.language === track.language || v.audioId?.toString() === track.id
    )

    if (matchingVariant) {
      this.player.selectVariantTrack(matchingVariant, /* clearBuffer */ false)
      this.setSelectedAudioTrack(track)
    }
  }

  /**
   * Set subtitle track
   */
  setSubtitleTrack(track: SubtitleTrack | null): void {
    this.ensureInitialized()

    if (!this.player) return

    if (track === null) {
      this.player.setTextTrackVisibility(false)
      this.setSelectedSubtitleTrack(null)
    } else {
      const textTracks = this.player.getTextTracks()
      const matchingTrack = textTracks.find(
        t => t.language === track.language || t.label === track.label
      )

      if (matchingTrack) {
        this.player.selectTextTrack(matchingTrack)
        this.player.setTextTrackVisibility(true)
        this.setSelectedSubtitleTrack(track)
      }
    }
  }

  /**
   * Update all track information from Shaka Player
   */
  private updateAllTracks(): void {
    this.updateQualityTracks()
    this.updateAudioTracks()
    this.updateSubtitleTracks()
  }

  /**
   * Update quality tracks from variant tracks
   */
  private updateQualityTracks(): void {
    if (!this.player) return

    const variants = this.player.getVariantTracks()
    const uniqueQualities = new Map<string, QualityTrack>()

    for (const variant of variants) {
      if (variant.height && variant.width) {
        const key = `${variant.height}p`
        if (!uniqueQualities.has(key)) {
          uniqueQualities.set(key, {
            id: variant.id?.toString() || key,
            label: key,
            height: variant.height,
            width: variant.width,
            bitrate: variant.bandwidth || 0,
            codec: variant.videoCodec || undefined,
            frameRate: variant.frameRate || undefined,
          })
        }
      }
    }

    // Sort by height descending
    const tracks = Array.from(uniqueQualities.values()).sort(
      (a, b) => b.height - a.height
    )

    this.setQualityTracks(tracks)

    // Update selected quality
    const activeVariant = variants.find(v => v.active)
    if (activeVariant && activeVariant.height) {
      const activeTrack = tracks.find(t => t.height === activeVariant.height)
      if (activeTrack) {
        const isAuto = this.player.getConfiguration().abr?.enabled ?? true
        this.setSelectedQuality(activeTrack, isAuto)
      }
    }
  }

  /**
   * Update audio tracks from variant tracks
   */
  private updateAudioTracks(): void {
    if (!this.player) return

    const variants = this.player.getVariantTracks()
    const uniqueAudio = new Map<string, AudioTrack>()

    for (const variant of variants) {
      const key = variant.language || 'default'
      if (!uniqueAudio.has(key)) {
        uniqueAudio.set(key, {
          id: variant.audioId?.toString() || key,
          label: variant.label || variant.language || 'Default',
          language: variant.language || 'und',
          channels: variant.channelsCount || undefined,
          codec: variant.audioCodec || undefined,
          bitrate: variant.audioBandwidth || undefined,
        })
      }
    }

    const tracks = Array.from(uniqueAudio.values())
    this.setAudioTracks(tracks)

    // Update selected audio track
    const activeVariant = variants.find(v => v.active)
    if (activeVariant) {
      const activeTrack = tracks.find(t => t.language === activeVariant.language)
      if (activeTrack) {
        this.setSelectedAudioTrack(activeTrack)
      }
    }
  }

  /**
   * Update subtitle tracks from text tracks
   */
  private updateSubtitleTracks(): void {
    if (!this.player) return

    const textTracks = this.player.getTextTracks()
    const tracks: SubtitleTrack[] = textTracks.map(track => ({
      id: track.id?.toString() || track.language || 'default',
      label: track.label || track.language || 'Default',
      language: track.language || 'und',
      isClosedCaption: track.kind === 'captions',
      mimeType: track.mimeType || undefined,
    }))

    this.setSubtitleTracks(tracks)

    // Update selected subtitle track
    const activeTrack = textTracks.find(t => t.active)
    if (activeTrack && this.player.isTextTrackVisible()) {
      const selected = tracks.find(t => t.language === activeTrack.language)
      if (selected) {
        this.setSelectedSubtitleTrack(selected)
      }
    }
  }

  /**
   * Destroy the player and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.player) {
      try {
        await this.player.destroy()
      } catch {
        // Ignore destroy errors
      }
      this.player = null
    }

    this.shaka = null

    await super.destroy()
  }
}
