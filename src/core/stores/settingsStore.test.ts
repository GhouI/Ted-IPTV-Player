import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import {
  useSettingsStore,
  DEFAULT_SETTINGS,
  BUFFER_SIZE_MIN,
  BUFFER_SIZE_MAX,
  RETRY_ATTEMPTS_MIN,
  RETRY_ATTEMPTS_MAX,
  RETRY_DELAY_MIN,
  RETRY_DELAY_MAX,
  EPG_UPDATE_INTERVAL_MIN,
  EPG_UPDATE_INTERVAL_MAX,
} from './settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useSettingsStore.getState().resetToDefaults()
    })
  })

  describe('initial state', () => {
    it('should have default quality preference as auto', () => {
      const { qualityPreference } = useSettingsStore.getState()
      expect(qualityPreference).toBe('auto')
    })

    it('should have default buffer size of 30 seconds', () => {
      const { bufferSize } = useSettingsStore.getState()
      expect(bufferSize).toBe(30)
    })

    it('should have default volume of 1', () => {
      const { defaultVolume } = useSettingsStore.getState()
      expect(defaultVolume).toBe(1)
    })

    it('should have all default settings', () => {
      const state = useSettingsStore.getState()
      expect(state.qualityPreference).toBe(DEFAULT_SETTINGS.qualityPreference)
      expect(state.bufferSize).toBe(DEFAULT_SETTINGS.bufferSize)
      expect(state.defaultVolume).toBe(DEFAULT_SETTINGS.defaultVolume)
      expect(state.startMuted).toBe(DEFAULT_SETTINGS.startMuted)
      expect(state.autoPlay).toBe(DEFAULT_SETTINGS.autoPlay)
      expect(state.preferredAudioLanguage).toBe(
        DEFAULT_SETTINGS.preferredAudioLanguage
      )
      expect(state.preferredSubtitleLanguage).toBe(
        DEFAULT_SETTINGS.preferredSubtitleLanguage
      )
      expect(state.lowLatencyMode).toBe(DEFAULT_SETTINGS.lowLatencyMode)
      expect(state.retryAttempts).toBe(DEFAULT_SETTINGS.retryAttempts)
      expect(state.retryDelay).toBe(DEFAULT_SETTINGS.retryDelay)
      expect(state.showChannelLogos).toBe(DEFAULT_SETTINGS.showChannelLogos)
      expect(state.epgUpdateInterval).toBe(DEFAULT_SETTINGS.epgUpdateInterval)
    })
  })

  describe('setQualityPreference', () => {
    it('should set quality preference to low', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('low')
      })
      expect(useSettingsStore.getState().qualityPreference).toBe('low')
    })

    it('should set quality preference to medium', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('medium')
      })
      expect(useSettingsStore.getState().qualityPreference).toBe('medium')
    })

    it('should set quality preference to high', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('high')
      })
      expect(useSettingsStore.getState().qualityPreference).toBe('high')
    })

    it('should set quality preference to highest', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('highest')
      })
      expect(useSettingsStore.getState().qualityPreference).toBe('highest')
    })

    it('should set quality preference to auto', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('high')
        useSettingsStore.getState().setQualityPreference('auto')
      })
      expect(useSettingsStore.getState().qualityPreference).toBe('auto')
    })
  })

  describe('setBufferSize', () => {
    it('should set buffer size within valid range', () => {
      act(() => {
        useSettingsStore.getState().setBufferSize(60)
      })
      expect(useSettingsStore.getState().bufferSize).toBe(60)
    })

    it('should clamp buffer size to minimum', () => {
      act(() => {
        useSettingsStore.getState().setBufferSize(1)
      })
      expect(useSettingsStore.getState().bufferSize).toBe(BUFFER_SIZE_MIN)
    })

    it('should clamp buffer size to maximum', () => {
      act(() => {
        useSettingsStore.getState().setBufferSize(500)
      })
      expect(useSettingsStore.getState().bufferSize).toBe(BUFFER_SIZE_MAX)
    })
  })

  describe('setDefaultVolume', () => {
    it('should set volume within valid range', () => {
      act(() => {
        useSettingsStore.getState().setDefaultVolume(0.5)
      })
      expect(useSettingsStore.getState().defaultVolume).toBe(0.5)
    })

    it('should clamp volume to 0', () => {
      act(() => {
        useSettingsStore.getState().setDefaultVolume(-0.5)
      })
      expect(useSettingsStore.getState().defaultVolume).toBe(0)
    })

    it('should clamp volume to 1', () => {
      act(() => {
        useSettingsStore.getState().setDefaultVolume(1.5)
      })
      expect(useSettingsStore.getState().defaultVolume).toBe(1)
    })
  })

  describe('setStartMuted', () => {
    it('should set startMuted to true', () => {
      act(() => {
        useSettingsStore.getState().setStartMuted(true)
      })
      expect(useSettingsStore.getState().startMuted).toBe(true)
    })

    it('should set startMuted to false', () => {
      act(() => {
        useSettingsStore.getState().setStartMuted(true)
        useSettingsStore.getState().setStartMuted(false)
      })
      expect(useSettingsStore.getState().startMuted).toBe(false)
    })
  })

  describe('setAutoPlay', () => {
    it('should set autoPlay to true', () => {
      act(() => {
        useSettingsStore.getState().setAutoPlay(true)
      })
      expect(useSettingsStore.getState().autoPlay).toBe(true)
    })

    it('should set autoPlay to false', () => {
      act(() => {
        useSettingsStore.getState().setAutoPlay(false)
      })
      expect(useSettingsStore.getState().autoPlay).toBe(false)
    })
  })

  describe('setPreferredAudioLanguage', () => {
    it('should set preferred audio language', () => {
      act(() => {
        useSettingsStore.getState().setPreferredAudioLanguage('es')
      })
      expect(useSettingsStore.getState().preferredAudioLanguage).toBe('es')
    })
  })

  describe('setPreferredSubtitleLanguage', () => {
    it('should set preferred subtitle language', () => {
      act(() => {
        useSettingsStore.getState().setPreferredSubtitleLanguage('en')
      })
      expect(useSettingsStore.getState().preferredSubtitleLanguage).toBe('en')
    })

    it('should set preferred subtitle language to null', () => {
      act(() => {
        useSettingsStore.getState().setPreferredSubtitleLanguage('en')
        useSettingsStore.getState().setPreferredSubtitleLanguage(null)
      })
      expect(useSettingsStore.getState().preferredSubtitleLanguage).toBe(null)
    })
  })

  describe('setLowLatencyMode', () => {
    it('should enable low latency mode', () => {
      act(() => {
        useSettingsStore.getState().setLowLatencyMode(true)
      })
      expect(useSettingsStore.getState().lowLatencyMode).toBe(true)
    })

    it('should disable low latency mode', () => {
      act(() => {
        useSettingsStore.getState().setLowLatencyMode(true)
        useSettingsStore.getState().setLowLatencyMode(false)
      })
      expect(useSettingsStore.getState().lowLatencyMode).toBe(false)
    })
  })

  describe('setRetryAttempts', () => {
    it('should set retry attempts within valid range', () => {
      act(() => {
        useSettingsStore.getState().setRetryAttempts(5)
      })
      expect(useSettingsStore.getState().retryAttempts).toBe(5)
    })

    it('should clamp retry attempts to minimum', () => {
      act(() => {
        useSettingsStore.getState().setRetryAttempts(-5)
      })
      expect(useSettingsStore.getState().retryAttempts).toBe(RETRY_ATTEMPTS_MIN)
    })

    it('should clamp retry attempts to maximum', () => {
      act(() => {
        useSettingsStore.getState().setRetryAttempts(100)
      })
      expect(useSettingsStore.getState().retryAttempts).toBe(RETRY_ATTEMPTS_MAX)
    })
  })

  describe('setRetryDelay', () => {
    it('should set retry delay within valid range', () => {
      act(() => {
        useSettingsStore.getState().setRetryDelay(2000)
      })
      expect(useSettingsStore.getState().retryDelay).toBe(2000)
    })

    it('should clamp retry delay to minimum', () => {
      act(() => {
        useSettingsStore.getState().setRetryDelay(10)
      })
      expect(useSettingsStore.getState().retryDelay).toBe(RETRY_DELAY_MIN)
    })

    it('should clamp retry delay to maximum', () => {
      act(() => {
        useSettingsStore.getState().setRetryDelay(50000)
      })
      expect(useSettingsStore.getState().retryDelay).toBe(RETRY_DELAY_MAX)
    })
  })

  describe('setShowChannelLogos', () => {
    it('should enable showing channel logos', () => {
      act(() => {
        useSettingsStore.getState().setShowChannelLogos(true)
      })
      expect(useSettingsStore.getState().showChannelLogos).toBe(true)
    })

    it('should disable showing channel logos', () => {
      act(() => {
        useSettingsStore.getState().setShowChannelLogos(false)
      })
      expect(useSettingsStore.getState().showChannelLogos).toBe(false)
    })
  })

  describe('setEpgUpdateInterval', () => {
    it('should set EPG update interval within valid range', () => {
      act(() => {
        useSettingsStore.getState().setEpgUpdateInterval(120)
      })
      expect(useSettingsStore.getState().epgUpdateInterval).toBe(120)
    })

    it('should clamp EPG update interval to minimum', () => {
      act(() => {
        useSettingsStore.getState().setEpgUpdateInterval(5)
      })
      expect(useSettingsStore.getState().epgUpdateInterval).toBe(
        EPG_UPDATE_INTERVAL_MIN
      )
    })

    it('should clamp EPG update interval to maximum', () => {
      act(() => {
        useSettingsStore.getState().setEpgUpdateInterval(1000)
      })
      expect(useSettingsStore.getState().epgUpdateInterval).toBe(
        EPG_UPDATE_INTERVAL_MAX
      )
    })
  })

  describe('getQualityHeight', () => {
    it('should return "auto" for auto preference', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('auto')
      })
      expect(useSettingsStore.getState().getQualityHeight()).toBe('auto')
    })

    it('should return 480 for low preference', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('low')
      })
      expect(useSettingsStore.getState().getQualityHeight()).toBe(480)
    })

    it('should return 720 for medium preference', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('medium')
      })
      expect(useSettingsStore.getState().getQualityHeight()).toBe(720)
    })

    it('should return 1080 for high preference', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('high')
      })
      expect(useSettingsStore.getState().getQualityHeight()).toBe(1080)
    })

    it('should return 2160 for highest preference', () => {
      act(() => {
        useSettingsStore.getState().setQualityPreference('highest')
      })
      expect(useSettingsStore.getState().getQualityHeight()).toBe(2160)
    })
  })

  describe('resetToDefaults', () => {
    it('should reset all settings to default values', () => {
      // Change all settings
      act(() => {
        useSettingsStore.getState().setQualityPreference('high')
        useSettingsStore.getState().setBufferSize(60)
        useSettingsStore.getState().setDefaultVolume(0.5)
        useSettingsStore.getState().setStartMuted(true)
        useSettingsStore.getState().setAutoPlay(false)
        useSettingsStore.getState().setPreferredAudioLanguage('es')
        useSettingsStore.getState().setPreferredSubtitleLanguage('en')
        useSettingsStore.getState().setLowLatencyMode(true)
        useSettingsStore.getState().setRetryAttempts(5)
        useSettingsStore.getState().setRetryDelay(2000)
        useSettingsStore.getState().setShowChannelLogos(false)
        useSettingsStore.getState().setEpgUpdateInterval(120)
      })

      // Reset to defaults
      act(() => {
        useSettingsStore.getState().resetToDefaults()
      })

      // Verify all settings are reset
      const state = useSettingsStore.getState()
      expect(state.qualityPreference).toBe(DEFAULT_SETTINGS.qualityPreference)
      expect(state.bufferSize).toBe(DEFAULT_SETTINGS.bufferSize)
      expect(state.defaultVolume).toBe(DEFAULT_SETTINGS.defaultVolume)
      expect(state.startMuted).toBe(DEFAULT_SETTINGS.startMuted)
      expect(state.autoPlay).toBe(DEFAULT_SETTINGS.autoPlay)
      expect(state.preferredAudioLanguage).toBe(
        DEFAULT_SETTINGS.preferredAudioLanguage
      )
      expect(state.preferredSubtitleLanguage).toBe(
        DEFAULT_SETTINGS.preferredSubtitleLanguage
      )
      expect(state.lowLatencyMode).toBe(DEFAULT_SETTINGS.lowLatencyMode)
      expect(state.retryAttempts).toBe(DEFAULT_SETTINGS.retryAttempts)
      expect(state.retryDelay).toBe(DEFAULT_SETTINGS.retryDelay)
      expect(state.showChannelLogos).toBe(DEFAULT_SETTINGS.showChannelLogos)
      expect(state.epgUpdateInterval).toBe(DEFAULT_SETTINGS.epgUpdateInterval)
    })
  })
})
