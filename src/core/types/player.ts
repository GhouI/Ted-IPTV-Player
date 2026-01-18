/**
 * Player state and events types for video playback
 */

/**
 * Playback state of the player
 */
export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'

/**
 * Supported stream types
 */
export type StreamType = 'hls' | 'dash' | 'mp4' | 'unknown'

/**
 * Video quality track information
 */
export interface QualityTrack {
  /** Unique identifier for this quality track */
  id: string
  /** Display label (e.g., '1080p', '720p', 'Auto') */
  label: string
  /** Video height in pixels */
  height: number
  /** Video width in pixels */
  width: number
  /** Bitrate in bits per second */
  bitrate: number
  /** Codec string (e.g., 'avc1.4d401f') */
  codec?: string
  /** Frame rate */
  frameRate?: number
}

/**
 * Audio track information
 */
export interface AudioTrack {
  /** Unique identifier for this audio track */
  id: string
  /** Display label (e.g., 'English', 'Spanish') */
  label: string
  /** Language code (e.g., 'en', 'es') */
  language: string
  /** Number of audio channels */
  channels?: number
  /** Codec string */
  codec?: string
  /** Bitrate in bits per second */
  bitrate?: number
}

/**
 * Subtitle/caption track information
 */
export interface SubtitleTrack {
  /** Unique identifier for this subtitle track */
  id: string
  /** Display label (e.g., 'English', 'Spanish CC') */
  label: string
  /** Language code (e.g., 'en', 'es') */
  language: string
  /** Whether this is a closed caption track */
  isClosedCaption?: boolean
  /** MIME type of the subtitle format */
  mimeType?: string
}

/**
 * Player error information
 */
export interface PlayerError {
  /** Error code for programmatic handling */
  code: PlayerErrorCode
  /** Human-readable error message */
  message: string
  /** Whether the error is recoverable (retry possible) */
  recoverable: boolean
  /** Original error object if available */
  cause?: Error | unknown
  /** Timestamp when error occurred */
  timestamp: number
}

/**
 * Player error codes
 */
export type PlayerErrorCode =
  | 'NETWORK_ERROR'
  | 'MEDIA_ERROR'
  | 'DECODE_ERROR'
  | 'SOURCE_NOT_SUPPORTED'
  | 'DRM_ERROR'
  | 'MANIFEST_ERROR'
  | 'SEGMENT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Current player state snapshot
 */
export interface PlayerState {
  /** Current playback state */
  playbackState: PlaybackState
  /** Current playback position in seconds */
  currentTime: number
  /** Total duration in seconds (0 for live streams) */
  duration: number
  /** Buffered time ahead in seconds */
  bufferedTime: number
  /** Current volume level (0-1) */
  volume: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Whether playing live content */
  isLive: boolean
  /** Whether stream is seekable */
  isSeekable: boolean
  /** Current stream URL being played */
  currentUrl: string | null
  /** Detected stream type */
  streamType: StreamType
  /** Available quality tracks */
  qualityTracks: QualityTrack[]
  /** Currently selected quality track (null for auto) */
  selectedQuality: QualityTrack | null
  /** Whether auto quality selection is enabled */
  isAutoQuality: boolean
  /** Available audio tracks */
  audioTracks: AudioTrack[]
  /** Currently selected audio track */
  selectedAudioTrack: AudioTrack | null
  /** Available subtitle tracks */
  subtitleTracks: SubtitleTrack[]
  /** Currently selected subtitle track (null if disabled) */
  selectedSubtitleTrack: SubtitleTrack | null
  /** Current error if in error state */
  error: PlayerError | null
}

/**
 * Player event types
 */
export type PlayerEventType =
  | 'statechange'
  | 'timeupdate'
  | 'durationchange'
  | 'volumechange'
  | 'qualitychange'
  | 'audiotrackchange'
  | 'subtitletrackchange'
  | 'tracksloaded'
  | 'buffering'
  | 'error'
  | 'ended'

/**
 * Base player event
 */
export interface PlayerEventBase {
  /** Type of the event */
  type: PlayerEventType
  /** Timestamp when event occurred */
  timestamp: number
}

/**
 * State change event data
 */
export interface StateChangeEvent extends PlayerEventBase {
  type: 'statechange'
  /** Previous playback state */
  previousState: PlaybackState
  /** New playback state */
  newState: PlaybackState
}

/**
 * Time update event data
 */
export interface TimeUpdateEvent extends PlayerEventBase {
  type: 'timeupdate'
  /** Current playback position in seconds */
  currentTime: number
  /** Buffered time ahead in seconds */
  bufferedTime: number
}

/**
 * Duration change event data
 */
export interface DurationChangeEvent extends PlayerEventBase {
  type: 'durationchange'
  /** New duration in seconds */
  duration: number
  /** Whether this is a live stream */
  isLive: boolean
}

/**
 * Volume change event data
 */
export interface VolumeChangeEvent extends PlayerEventBase {
  type: 'volumechange'
  /** New volume level (0-1) */
  volume: number
  /** Whether audio is muted */
  isMuted: boolean
}

/**
 * Quality change event data
 */
export interface QualityChangeEvent extends PlayerEventBase {
  type: 'qualitychange'
  /** Previous quality track */
  previousQuality: QualityTrack | null
  /** New quality track (null for auto) */
  newQuality: QualityTrack | null
  /** Whether auto quality is now enabled */
  isAuto: boolean
}

/**
 * Audio track change event data
 */
export interface AudioTrackChangeEvent extends PlayerEventBase {
  type: 'audiotrackchange'
  /** New audio track */
  audioTrack: AudioTrack
}

/**
 * Subtitle track change event data
 */
export interface SubtitleTrackChangeEvent extends PlayerEventBase {
  type: 'subtitletrackchange'
  /** New subtitle track (null if disabled) */
  subtitleTrack: SubtitleTrack | null
}

/**
 * Tracks loaded event data
 */
export interface TracksLoadedEvent extends PlayerEventBase {
  type: 'tracksloaded'
  /** Available quality tracks */
  qualityTracks: QualityTrack[]
  /** Available audio tracks */
  audioTracks: AudioTrack[]
  /** Available subtitle tracks */
  subtitleTracks: SubtitleTrack[]
}

/**
 * Buffering event data
 */
export interface BufferingEvent extends PlayerEventBase {
  type: 'buffering'
  /** Whether buffering started or ended */
  isBuffering: boolean
  /** Buffer percentage (0-100) */
  bufferPercent: number
}

/**
 * Error event data
 */
export interface ErrorEvent extends PlayerEventBase {
  type: 'error'
  /** Error details */
  error: PlayerError
}

/**
 * Playback ended event data
 */
export interface EndedEvent extends PlayerEventBase {
  type: 'ended'
}

/**
 * Union type of all player events
 */
export type PlayerEvent =
  | StateChangeEvent
  | TimeUpdateEvent
  | DurationChangeEvent
  | VolumeChangeEvent
  | QualityChangeEvent
  | AudioTrackChangeEvent
  | SubtitleTrackChangeEvent
  | TracksLoadedEvent
  | BufferingEvent
  | ErrorEvent
  | EndedEvent

/**
 * Event listener callback type
 */
export type PlayerEventListener<T extends PlayerEvent = PlayerEvent> = (event: T) => void

/**
 * Player configuration options
 */
export interface PlayerConfig {
  /** Initial volume level (0-1) */
  initialVolume?: number
  /** Whether to start muted */
  startMuted?: boolean
  /** Whether to auto-play when source is loaded */
  autoPlay?: boolean
  /** Preferred initial quality ('auto' or specific height like 720) */
  preferredQuality?: 'auto' | number
  /** Preferred audio language code */
  preferredAudioLanguage?: string
  /** Preferred subtitle language code (null to disable) */
  preferredSubtitleLanguage?: string | null
  /** Buffer size in seconds */
  bufferSize?: number
  /** Retry attempts for failed segments */
  retryAttempts?: number
  /** Delay between retries in milliseconds */
  retryDelay?: number
  /** Low latency mode for live streams */
  lowLatencyMode?: boolean
}

/**
 * Player adapter interface for video playback abstraction
 */
export interface PlayerAdapter {
  /** Initialize the player with a video element */
  initialize(videoElement: HTMLVideoElement, config?: PlayerConfig): Promise<void>
  /** Load and optionally start playing a stream */
  load(url: string, autoPlay?: boolean): Promise<void>
  /** Start or resume playback */
  play(): Promise<void>
  /** Pause playback */
  pause(): void
  /** Seek to a position in seconds */
  seek(time: number): void
  /** Set volume level (0-1) */
  setVolume(volume: number): void
  /** Mute audio */
  mute(): void
  /** Unmute audio */
  unmute(): void
  /** Select a specific quality track (null for auto) */
  setQuality(quality: QualityTrack | null): void
  /** Select an audio track */
  setAudioTrack(track: AudioTrack): void
  /** Select a subtitle track (null to disable) */
  setSubtitleTrack(track: SubtitleTrack | null): void
  /** Get current player state snapshot */
  getState(): PlayerState
  /** Add an event listener */
  addEventListener<T extends PlayerEventType>(
    type: T,
    listener: PlayerEventListener
  ): void
  /** Remove an event listener */
  removeEventListener<T extends PlayerEventType>(
    type: T,
    listener: PlayerEventListener
  ): void
  /** Destroy the player and clean up resources */
  destroy(): Promise<void>
}

/**
 * Player capability detection result
 */
export interface PlayerCapabilities {
  /** Whether Media Source Extensions are supported */
  mse: boolean
  /** Whether Encrypted Media Extensions are supported */
  eme: boolean
  /** Whether HLS playback is supported */
  hls: boolean
  /** Whether DASH playback is supported */
  dash: boolean
  /** Whether native video playback is available */
  nativeVideo: boolean
  /** List of supported video codecs */
  supportedVideoCodecs: string[]
  /** List of supported audio codecs */
  supportedAudioCodecs: string[]
}

/**
 * Default player state
 */
export const DEFAULT_PLAYER_STATE: PlayerState = {
  playbackState: 'idle',
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  volume: 1,
  isMuted: false,
  isLive: false,
  isSeekable: true,
  currentUrl: null,
  streamType: 'unknown',
  qualityTracks: [],
  selectedQuality: null,
  isAutoQuality: true,
  audioTracks: [],
  selectedAudioTrack: null,
  subtitleTracks: [],
  selectedSubtitleTrack: null,
  error: null,
}

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER_CONFIG: Required<PlayerConfig> = {
  initialVolume: 1,
  startMuted: false,
  autoPlay: false,
  preferredQuality: 'auto',
  preferredAudioLanguage: 'en',
  preferredSubtitleLanguage: null,
  bufferSize: 30,
  retryAttempts: 3,
  retryDelay: 1000,
  lowLatencyMode: false,
}
