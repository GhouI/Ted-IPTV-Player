/**
 * Native HTML5 video player adapter
 *
 * Provides a fallback player for direct streams (MP4, WebM, etc.)
 * when Shaka Player is not needed or available. Uses the browser's
 * native HTML5 video element capabilities.
 */

import { BasePlayerAdapter } from './BasePlayerAdapter'
import type {
  QualityTrack,
  AudioTrack,
  SubtitleTrack,
  PlayerConfig,
} from '../types/player'

/**
 * NativePlayerAdapter - HTML5 video element based player
 *
 * This adapter is used as a fallback for:
 * - Direct MP4/WebM streams that don't need adaptive streaming
 * - Browsers/devices where MSE is not available
 * - Simple playback scenarios where Shaka Player overhead isn't needed
 * - Native HLS on Safari (which has built-in HLS support)
 */
export class NativePlayerAdapter extends BasePlayerAdapter {
  /** Track URL for text tracks management */
  private textTracks: Map<string, TextTrack> = new Map()

  /** Track elements for cleanup */
  private trackElements: HTMLTrackElement[] = []

  /**
   * Initialize the native player
   */
  async initialize(videoElement: HTMLVideoElement, config?: PlayerConfig): Promise<void> {
    await super.initialize(videoElement, config)
  }

  /**
   * Load a direct stream URL
   *
   * For native playback, we simply set the video src attribute.
   * The browser handles format detection and playback.
   */
  async load(url: string, autoPlay = false): Promise<void> {
    this.ensureInitialized()

    if (!this.videoElement) {
      throw new Error('Video element not available')
    }

    // Clear any previous error
    this.clearError()

    // Set loading state
    this.setPlaybackState('loading')

    // Detect stream type
    const streamType = this.detectStreamType(url)
    this.setCurrentStream(url, streamType)

    try {
      // Set the source directly on the video element
      this.videoElement.src = url

      // Wait for metadata to be loaded
      await this.waitForLoadedMetadata()

      // Extract track information from the video element
      this.extractTracks()

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
        'Failed to load media source',
        true,
        error
      )
      throw error
    }
  }

  /**
   * Set quality track
   *
   * Native player doesn't support adaptive quality switching.
   * This is a no-op but maintains interface compatibility.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setQuality(quality: QualityTrack | null): void {
    // Native player doesn't support quality selection
    // The single available quality is automatically used
  }

  /**
   * Set audio track
   *
   * Selects an audio track if the video has multiple audio tracks.
   */
  setAudioTrack(track: AudioTrack): void {
    this.ensureInitialized()

    if (!this.videoElement) return

    // HTML5 video audio track selection
    const audioTracks = this.videoElement.audioTracks
    if (audioTracks) {
      for (let i = 0; i < audioTracks.length; i++) {
        const audioTrack = audioTracks[i]
        audioTrack.enabled = audioTrack.id === track.id
      }
      this.setSelectedAudioTrack(track)
    }
  }

  /**
   * Set subtitle track
   *
   * Enables or disables subtitle display.
   */
  setSubtitleTrack(track: SubtitleTrack | null): void {
    this.ensureInitialized()

    if (!this.videoElement) return

    const textTracks = this.videoElement.textTracks
    if (textTracks) {
      // Disable all text tracks first
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = 'disabled'
      }

      // Enable the selected track
      if (track) {
        for (let i = 0; i < textTracks.length; i++) {
          const textTrack = textTracks[i]
          if (textTrack.label === track.label && textTrack.language === track.language) {
            textTrack.mode = 'showing'
            break
          }
        }
      }

      this.setSelectedSubtitleTrack(track)
    }
  }

  /**
   * Add an external subtitle track
   *
   * Allows adding VTT or other subtitle files to the video.
   */
  addSubtitleTrack(url: string, language: string, label: string): void {
    this.ensureInitialized()

    if (!this.videoElement) return

    const trackElement = document.createElement('track')
    trackElement.kind = 'subtitles'
    trackElement.src = url
    trackElement.srclang = language
    trackElement.label = label

    this.videoElement.appendChild(trackElement)
    this.trackElements.push(trackElement)

    // Update subtitle tracks list
    this.extractSubtitleTracks()
  }

  /**
   * Destroy the player and clean up resources
   */
  async destroy(): Promise<void> {
    // Clean up track elements
    this.trackElements.forEach(track => {
      track.remove()
    })
    this.trackElements = []

    // Clear text tracks map
    this.textTracks.clear()

    // Clear video source to stop any ongoing loading
    if (this.videoElement) {
      this.videoElement.removeAttribute('src')
      this.videoElement.load()
    }

    await super.destroy()
  }

  /**
   * Wait for video metadata to be loaded
   */
  private waitForLoadedMetadata(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement) {
        reject(new Error('Video element not available'))
        return
      }

      // Check if already loaded
      if (this.videoElement.readyState >= 1) {
        resolve()
        return
      }

      const onLoadedMetadata = () => {
        cleanup()
        resolve()
      }

      const onError = () => {
        cleanup()
        const error = this.videoElement?.error
        reject(new Error(error?.message || 'Failed to load video metadata'))
      }

      const cleanup = () => {
        this.videoElement?.removeEventListener('loadedmetadata', onLoadedMetadata)
        this.videoElement?.removeEventListener('error', onError)
      }

      this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata)
      this.videoElement.addEventListener('error', onError)
    })
  }

  /**
   * Extract track information from the video element
   */
  private extractTracks(): void {
    this.extractQualityTracks()
    this.extractAudioTracks()
    this.extractSubtitleTracks()
  }

  /**
   * Extract quality tracks
   *
   * For native playback, there's typically only one quality level
   * which is the original video quality.
   */
  private extractQualityTracks(): void {
    if (!this.videoElement) return

    // Create a single quality track representing the video's native resolution
    const qualityTrack: QualityTrack = {
      id: 'native',
      label: `${this.videoElement.videoHeight}p`,
      height: this.videoElement.videoHeight || 0,
      width: this.videoElement.videoWidth || 0,
      bitrate: 0, // Not available for native playback
    }

    // Only add if we have valid dimensions
    if (qualityTrack.height > 0 && qualityTrack.width > 0) {
      this.setQualityTracks([qualityTrack])
      this.setSelectedQuality(qualityTrack, false)
    }
  }

  /**
   * Extract audio tracks from the video element
   */
  private extractAudioTracks(): void {
    if (!this.videoElement) return

    const audioTracks = this.videoElement.audioTracks
    if (!audioTracks || audioTracks.length === 0) {
      // Create a default audio track if none detected
      const defaultTrack: AudioTrack = {
        id: 'default',
        label: 'Default',
        language: 'und', // Undetermined
      }
      this.setAudioTracks([defaultTrack])
      this.setSelectedAudioTrack(defaultTrack)
      return
    }

    const tracks: AudioTrack[] = []
    let selectedTrack: AudioTrack | null = null

    for (let i = 0; i < audioTracks.length; i++) {
      const audioTrack = audioTracks[i]
      const track: AudioTrack = {
        id: audioTrack.id || `audio-${i}`,
        label: audioTrack.label || `Audio ${i + 1}`,
        language: audioTrack.language || 'und',
      }
      tracks.push(track)

      if (audioTrack.enabled) {
        selectedTrack = track
      }
    }

    this.setAudioTracks(tracks)
    if (selectedTrack) {
      this.setSelectedAudioTrack(selectedTrack)
    } else if (tracks.length > 0) {
      this.setSelectedAudioTrack(tracks[0])
    }
  }

  /**
   * Extract subtitle tracks from the video element
   */
  private extractSubtitleTracks(): void {
    if (!this.videoElement) return

    const textTracks = this.videoElement.textTracks
    if (!textTracks || textTracks.length === 0) {
      this.setSubtitleTracks([])
      return
    }

    const tracks: SubtitleTrack[] = []
    let selectedTrack: SubtitleTrack | null = null

    for (let i = 0; i < textTracks.length; i++) {
      const textTrack = textTracks[i]
      // Only include subtitle and caption tracks
      if (textTrack.kind !== 'subtitles' && textTrack.kind !== 'captions') {
        continue
      }

      const track: SubtitleTrack = {
        id: textTrack.label || `subtitle-${i}`,
        label: textTrack.label || `Subtitle ${i + 1}`,
        language: textTrack.language || 'und',
        isClosedCaption: textTrack.kind === 'captions',
      }
      tracks.push(track)

      // Store reference for later use
      this.textTracks.set(track.id, textTrack)

      if (textTrack.mode === 'showing') {
        selectedTrack = track
      }
    }

    this.setSubtitleTracks(tracks)
    if (selectedTrack) {
      this.setSelectedSubtitleTrack(selectedTrack)
    }
  }
}
