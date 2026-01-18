import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Video quality preference options
 */
export type QualityPreference = 'auto' | 'low' | 'medium' | 'high' | 'highest'

/**
 * Settings store state interface
 */
export interface SettingsState {
  /** Preferred video quality setting */
  qualityPreference: QualityPreference
  /** Buffer size in seconds for streaming */
  bufferSize: number
  /** Default volume level (0-1) */
  defaultVolume: number
  /** Whether to start playback muted */
  startMuted: boolean
  /** Whether to auto-play content */
  autoPlay: boolean
  /** Preferred audio language code */
  preferredAudioLanguage: string
  /** Preferred subtitle language code (null to disable) */
  preferredSubtitleLanguage: string | null
  /** Whether to enable low latency mode for live streams */
  lowLatencyMode: boolean
  /** Number of retry attempts for failed streams */
  retryAttempts: number
  /** Delay between retries in milliseconds */
  retryDelay: number
  /** Whether to show channel logos */
  showChannelLogos: boolean
  /** EPG update interval in minutes */
  epgUpdateInterval: number
}

/**
 * Settings store actions interface
 */
export interface SettingsActions {
  /** Set the quality preference */
  setQualityPreference: (preference: QualityPreference) => void
  /** Set the buffer size in seconds */
  setBufferSize: (size: number) => void
  /** Set the default volume level (0-1) */
  setDefaultVolume: (volume: number) => void
  /** Set whether to start playback muted */
  setStartMuted: (muted: boolean) => void
  /** Set whether to auto-play content */
  setAutoPlay: (autoPlay: boolean) => void
  /** Set preferred audio language */
  setPreferredAudioLanguage: (language: string) => void
  /** Set preferred subtitle language (null to disable) */
  setPreferredSubtitleLanguage: (language: string | null) => void
  /** Set low latency mode for live streams */
  setLowLatencyMode: (enabled: boolean) => void
  /** Set retry attempts for failed streams */
  setRetryAttempts: (attempts: number) => void
  /** Set retry delay in milliseconds */
  setRetryDelay: (delay: number) => void
  /** Set whether to show channel logos */
  setShowChannelLogos: (show: boolean) => void
  /** Set EPG update interval in minutes */
  setEpgUpdateInterval: (interval: number) => void
  /** Get quality height based on preference */
  getQualityHeight: () => number | 'auto'
  /** Reset all settings to defaults */
  resetToDefaults: () => void
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: SettingsState = {
  qualityPreference: 'auto',
  bufferSize: 30,
  defaultVolume: 1,
  startMuted: false,
  autoPlay: true,
  preferredAudioLanguage: 'en',
  preferredSubtitleLanguage: null,
  lowLatencyMode: false,
  retryAttempts: 3,
  retryDelay: 1000,
  showChannelLogos: true,
  epgUpdateInterval: 60,
}

/**
 * Map quality preference to approximate video height
 */
const QUALITY_HEIGHT_MAP: Record<Exclude<QualityPreference, 'auto'>, number> = {
  low: 480,
  medium: 720,
  high: 1080,
  highest: 2160,
}

/**
 * Valid buffer size range (in seconds)
 */
export const BUFFER_SIZE_MIN = 5
export const BUFFER_SIZE_MAX = 120

/**
 * Valid retry attempts range
 */
export const RETRY_ATTEMPTS_MIN = 0
export const RETRY_ATTEMPTS_MAX = 10

/**
 * Valid retry delay range (in milliseconds)
 */
export const RETRY_DELAY_MIN = 100
export const RETRY_DELAY_MAX = 10000

/**
 * Valid EPG update interval range (in minutes)
 */
export const EPG_UPDATE_INTERVAL_MIN = 15
export const EPG_UPDATE_INTERVAL_MAX = 360

/**
 * Zustand store for managing application settings with persistence
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setQualityPreference: (qualityPreference) => set({ qualityPreference }),

      setBufferSize: (size) => {
        const clampedSize = Math.max(
          BUFFER_SIZE_MIN,
          Math.min(BUFFER_SIZE_MAX, size)
        )
        set({ bufferSize: clampedSize })
      },

      setDefaultVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume))
        set({ defaultVolume: clampedVolume })
      },

      setStartMuted: (startMuted) => set({ startMuted }),

      setAutoPlay: (autoPlay) => set({ autoPlay }),

      setPreferredAudioLanguage: (preferredAudioLanguage) =>
        set({ preferredAudioLanguage }),

      setPreferredSubtitleLanguage: (preferredSubtitleLanguage) =>
        set({ preferredSubtitleLanguage }),

      setLowLatencyMode: (lowLatencyMode) => set({ lowLatencyMode }),

      setRetryAttempts: (attempts) => {
        const clampedAttempts = Math.max(
          RETRY_ATTEMPTS_MIN,
          Math.min(RETRY_ATTEMPTS_MAX, attempts)
        )
        set({ retryAttempts: clampedAttempts })
      },

      setRetryDelay: (delay) => {
        const clampedDelay = Math.max(
          RETRY_DELAY_MIN,
          Math.min(RETRY_DELAY_MAX, delay)
        )
        set({ retryDelay: clampedDelay })
      },

      setShowChannelLogos: (showChannelLogos) => set({ showChannelLogos }),

      setEpgUpdateInterval: (interval) => {
        const clampedInterval = Math.max(
          EPG_UPDATE_INTERVAL_MIN,
          Math.min(EPG_UPDATE_INTERVAL_MAX, interval)
        )
        set({ epgUpdateInterval: clampedInterval })
      },

      getQualityHeight: () => {
        const { qualityPreference } = get()
        if (qualityPreference === 'auto') {
          return 'auto'
        }
        return QUALITY_HEIGHT_MAP[qualityPreference]
      },

      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'ted-settings',
      version: 1,
    }
  )
)
