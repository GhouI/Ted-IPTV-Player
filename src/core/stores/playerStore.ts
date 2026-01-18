import { create } from 'zustand'
import type {
  PlaybackState,
  QualityTrack,
  AudioTrack,
  SubtitleTrack,
  PlayerError,
  StreamType,
} from '../types/player'

/**
 * Player store state interface
 */
export interface PlayerStoreState {
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
  /** Whether player controls should be visible */
  controlsVisible: boolean
  /** Timestamp when controls were last shown (for auto-hide reset) */
  controlsShownAt: number
  /** Whether player is in fullscreen mode */
  isFullscreen: boolean
}

/**
 * Player store actions interface
 */
export interface PlayerStoreActions {
  /** Set the playback state */
  setPlaybackState: (state: PlaybackState) => void
  /** Set the current playback time */
  setCurrentTime: (time: number) => void
  /** Set the duration */
  setDuration: (duration: number, isLive?: boolean) => void
  /** Set the buffered time */
  setBufferedTime: (time: number) => void
  /** Set the volume level (0-1) */
  setVolume: (volume: number) => void
  /** Toggle mute state */
  toggleMute: () => void
  /** Set mute state directly */
  setMuted: (isMuted: boolean) => void
  /** Set the current URL being played */
  setCurrentUrl: (url: string | null, streamType?: StreamType) => void
  /** Set available quality tracks */
  setQualityTracks: (tracks: QualityTrack[]) => void
  /** Select a quality track (null for auto) */
  selectQuality: (quality: QualityTrack | null) => void
  /** Enable auto quality selection */
  enableAutoQuality: () => void
  /** Set available audio tracks */
  setAudioTracks: (tracks: AudioTrack[]) => void
  /** Select an audio track */
  selectAudioTrack: (track: AudioTrack | null) => void
  /** Set available subtitle tracks */
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void
  /** Select a subtitle track (null to disable) */
  selectSubtitleTrack: (track: SubtitleTrack | null) => void
  /** Set player error */
  setError: (error: PlayerError | null) => void
  /** Set whether stream is seekable */
  setSeekable: (isSeekable: boolean) => void
  /** Show player controls */
  showControls: () => void
  /** Hide player controls */
  hideControls: () => void
  /** Set fullscreen state */
  setFullscreen: (isFullscreen: boolean) => void
  /** Get current quality label for display */
  getCurrentQualityLabel: () => string
  /** Get volume as percentage (0-100) */
  getVolumePercent: () => number
  /** Get playback progress as percentage (0-100) */
  getProgressPercent: () => number
  /** Get buffer progress as percentage (0-100) */
  getBufferPercent: () => number
  /** Check if player is currently playing */
  isPlaying: () => boolean
  /** Check if player is loading or buffering */
  isBuffering: () => boolean
  /** Reset the store to initial state */
  reset: () => void
}

const initialState: PlayerStoreState = {
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
  controlsVisible: true,
  controlsShownAt: Date.now(),
  isFullscreen: false,
}

/**
 * Zustand store for managing player state
 */
export const usePlayerStore = create<PlayerStoreState & PlayerStoreActions>()(
  (set, get) => ({
    ...initialState,

    setPlaybackState: (playbackState) => set({ playbackState }),

    setCurrentTime: (currentTime) => set({ currentTime }),

    setDuration: (duration, isLive = false) =>
      set({ duration, isLive, isSeekable: !isLive && duration > 0 }),

    setBufferedTime: (bufferedTime) => set({ bufferedTime }),

    setVolume: (volume) => {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      set({ volume: clampedVolume })
    },

    toggleMute: () => {
      const { isMuted } = get()
      set({ isMuted: !isMuted })
    },

    setMuted: (isMuted) => set({ isMuted }),

    setCurrentUrl: (url, streamType = 'unknown') =>
      set({
        currentUrl: url,
        streamType,
        // Reset playback state when loading new URL
        playbackState: url ? 'loading' : 'idle',
        currentTime: 0,
        duration: 0,
        bufferedTime: 0,
        error: null,
      }),

    setQualityTracks: (qualityTracks) => set({ qualityTracks }),

    selectQuality: (quality) =>
      set({
        selectedQuality: quality,
        isAutoQuality: quality === null,
      }),

    enableAutoQuality: () =>
      set({
        selectedQuality: null,
        isAutoQuality: true,
      }),

    setAudioTracks: (audioTracks) => set({ audioTracks }),

    selectAudioTrack: (track) => set({ selectedAudioTrack: track }),

    setSubtitleTracks: (subtitleTracks) => set({ subtitleTracks }),

    selectSubtitleTrack: (track) => set({ selectedSubtitleTrack: track }),

    setError: (error) =>
      set({
        error,
        playbackState: error ? 'error' : get().playbackState,
      }),

    setSeekable: (isSeekable) => set({ isSeekable }),

    showControls: () => set({ controlsVisible: true, controlsShownAt: Date.now() }),

    hideControls: () => set({ controlsVisible: false }),

    setFullscreen: (isFullscreen) => set({ isFullscreen }),

    getCurrentQualityLabel: () => {
      const { selectedQuality, isAutoQuality } = get()
      if (isAutoQuality) {
        return 'Auto'
      }
      return selectedQuality?.label ?? 'Unknown'
    },

    getVolumePercent: () => {
      const { volume } = get()
      return Math.round(volume * 100)
    },

    getProgressPercent: () => {
      const { currentTime, duration } = get()
      if (duration === 0) return 0
      return Math.min(100, (currentTime / duration) * 100)
    },

    getBufferPercent: () => {
      const { bufferedTime, duration } = get()
      if (duration === 0) return 0
      return Math.min(100, (bufferedTime / duration) * 100)
    },

    isPlaying: () => {
      const { playbackState } = get()
      return playbackState === 'playing'
    },

    isBuffering: () => {
      const { playbackState } = get()
      return playbackState === 'loading' || playbackState === 'buffering'
    },

    reset: () => set(initialState),
  })
)
