import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { PlaybackSettings } from './PlaybackSettings'
import {
  useSettingsStore,
  DEFAULT_SETTINGS,
  BUFFER_SIZE_MIN,
  BUFFER_SIZE_MAX,
} from '../../core/stores/settingsStore'

// Initialize spatial navigation before tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset settings store to defaults
  useSettingsStore.getState().resetToDefaults()
})

describe('PlaybackSettings', () => {
  describe('rendering', () => {
    it('should render the playback settings section', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByText('Playback Settings')).toBeInTheDocument()
    })

    it('should render with test ID', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByTestId('playback')).toBeInTheDocument()
    })

    it('should display all setting rows', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByText('Video Quality')).toBeInTheDocument()
      expect(screen.getByText('Buffer Size')).toBeInTheDocument()
      expect(screen.getByText('Auto-Play')).toBeInTheDocument()
      expect(screen.getByText('Low Latency Mode')).toBeInTheDocument()
      expect(screen.getByText('Show Channel Logos')).toBeInTheDocument()
    })

    it('should display setting descriptions', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByText('Select preferred streaming quality')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Automatically start playback')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Reduce delay for live streams')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Display logos in channel list')
      ).toBeInTheDocument()
    })
  })

  describe('quality selection', () => {
    it('should display all quality options', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByText('Auto')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(screen.getByText('Highest')).toBeInTheDocument()
    })

    it('should show auto as selected by default', () => {
      render(<PlaybackSettings testId="playback" />)

      const autoOption = screen.getByTestId('playback-quality-auto')
      expect(autoOption).toHaveAttribute('data-selected', 'true')
    })

    it('should change quality preference to low', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-quality-low'))

      expect(useSettingsStore.getState().qualityPreference).toBe('low')
    })

    it('should change quality preference to medium', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-quality-medium'))

      expect(useSettingsStore.getState().qualityPreference).toBe('medium')
    })

    it('should change quality preference to high', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-quality-high'))

      expect(useSettingsStore.getState().qualityPreference).toBe('high')
    })

    it('should change quality preference to highest', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-quality-highest'))

      expect(useSettingsStore.getState().qualityPreference).toBe('highest')
    })

    it('should update selected state when quality changes', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-quality-high'))

      const highOption = screen.getByTestId('playback-quality-high')
      const autoOption = screen.getByTestId('playback-quality-auto')

      expect(highOption).toHaveAttribute('data-selected', 'true')
      expect(autoOption).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('buffer size', () => {
    it('should display current buffer size', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByText(`${DEFAULT_SETTINGS.bufferSize} seconds`)
      ).toBeInTheDocument()
    })

    it('should render buffer slider', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByTestId('playback-buffer-slider')).toBeInTheDocument()
    })

    it('should display slider with correct initial value', () => {
      render(<PlaybackSettings testId="playback" />)

      const slider = screen.getByTestId('playback-buffer-slider')
      expect(slider).toHaveAttribute(
        'data-value',
        String(DEFAULT_SETTINGS.bufferSize)
      )
    })

    it('should update buffer size in store when changed', () => {
      useSettingsStore.getState().setBufferSize(45)
      render(<PlaybackSettings testId="playback" />)

      expect(useSettingsStore.getState().bufferSize).toBe(45)
      expect(screen.getByText('45 seconds')).toBeInTheDocument()
    })

    it('should respect buffer size minimum', () => {
      useSettingsStore.getState().setBufferSize(1)

      expect(useSettingsStore.getState().bufferSize).toBe(BUFFER_SIZE_MIN)
    })

    it('should respect buffer size maximum', () => {
      useSettingsStore.getState().setBufferSize(500)

      expect(useSettingsStore.getState().bufferSize).toBe(BUFFER_SIZE_MAX)
    })
  })

  describe('auto-play toggle', () => {
    it('should render auto-play toggle', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByTestId('playback-autoplay-toggle')
      ).toBeInTheDocument()
    })

    it('should show auto-play as on by default', () => {
      render(<PlaybackSettings testId="playback" />)

      const toggle = screen.getByTestId('playback-autoplay-toggle')
      expect(toggle).toHaveAttribute('data-on', 'true')
    })

    it('should toggle auto-play off', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-autoplay-toggle'))

      expect(useSettingsStore.getState().autoPlay).toBe(false)
    })

    it('should toggle auto-play on after being off', () => {
      useSettingsStore.getState().setAutoPlay(false)
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-autoplay-toggle'))

      expect(useSettingsStore.getState().autoPlay).toBe(true)
    })

    it('should have aria-pressed attribute', () => {
      render(<PlaybackSettings testId="playback" />)

      const toggle = screen.getByTestId('playback-autoplay-toggle')
      expect(toggle).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('low latency mode toggle', () => {
    it('should render low latency mode toggle', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByTestId('playback-lowlatency-toggle')
      ).toBeInTheDocument()
    })

    it('should show low latency as off by default', () => {
      render(<PlaybackSettings testId="playback" />)

      const toggle = screen.getByTestId('playback-lowlatency-toggle')
      expect(toggle).toHaveAttribute('data-on', 'false')
    })

    it('should toggle low latency mode on', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-lowlatency-toggle'))

      expect(useSettingsStore.getState().lowLatencyMode).toBe(true)
    })

    it('should toggle low latency mode off after being on', () => {
      useSettingsStore.getState().setLowLatencyMode(true)
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-lowlatency-toggle'))

      expect(useSettingsStore.getState().lowLatencyMode).toBe(false)
    })
  })

  describe('show channel logos toggle', () => {
    it('should render show channel logos toggle', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(screen.getByTestId('playback-logos-toggle')).toBeInTheDocument()
    })

    it('should show channel logos as on by default', () => {
      render(<PlaybackSettings testId="playback" />)

      const toggle = screen.getByTestId('playback-logos-toggle')
      expect(toggle).toHaveAttribute('data-on', 'true')
    })

    it('should toggle show channel logos off', () => {
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-logos-toggle'))

      expect(useSettingsStore.getState().showChannelLogos).toBe(false)
    })

    it('should toggle show channel logos on after being off', () => {
      useSettingsStore.getState().setShowChannelLogos(false)
      render(<PlaybackSettings testId="playback" />)

      fireEvent.click(screen.getByTestId('playback-logos-toggle'))

      expect(useSettingsStore.getState().showChannelLogos).toBe(true)
    })
  })

  describe('focus states', () => {
    it('should have data-focused attribute on quality options', () => {
      render(<PlaybackSettings testId="playback" />)

      const autoOption = screen.getByTestId('playback-quality-auto')
      expect(autoOption).toHaveAttribute('data-focused')
    })

    it('should have data-focused attribute on buffer slider', () => {
      render(<PlaybackSettings testId="playback" />)

      const slider = screen.getByTestId('playback-buffer-slider')
      expect(slider).toHaveAttribute('data-focused')
    })

    it('should have data-focused attribute on toggles', () => {
      render(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByTestId('playback-autoplay-toggle')
      ).toHaveAttribute('data-focused')
      expect(
        screen.getByTestId('playback-lowlatency-toggle')
      ).toHaveAttribute('data-focused')
      expect(
        screen.getByTestId('playback-logos-toggle')
      ).toHaveAttribute('data-focused')
    })
  })

  describe('accessibility', () => {
    it('should have proper button types', () => {
      render(<PlaybackSettings testId="playback" />)

      const autoOption = screen.getByTestId('playback-quality-auto')
      expect(autoOption.tagName).toBe('BUTTON')
      expect(autoOption).toHaveAttribute('type', 'button')
    })

    it('should have aria-pressed on toggle switches', () => {
      render(<PlaybackSettings testId="playback" />)

      const autoPlayToggle = screen.getByTestId('playback-autoplay-toggle')
      expect(autoPlayToggle).toHaveAttribute('aria-pressed')

      const lowLatencyToggle = screen.getByTestId('playback-lowlatency-toggle')
      expect(lowLatencyToggle).toHaveAttribute('aria-pressed')

      const logosToggle = screen.getByTestId('playback-logos-toggle')
      expect(logosToggle).toHaveAttribute('aria-pressed')
    })
  })

  describe('integration with settings store', () => {
    it('should reflect store changes in UI', () => {
      const { rerender } = render(<PlaybackSettings testId="playback" />)

      // Change settings via store
      useSettingsStore.getState().setQualityPreference('medium')
      useSettingsStore.getState().setAutoPlay(false)
      useSettingsStore.getState().setLowLatencyMode(true)

      rerender(<PlaybackSettings testId="playback" />)

      expect(
        screen.getByTestId('playback-quality-medium')
      ).toHaveAttribute('data-selected', 'true')
      expect(
        screen.getByTestId('playback-autoplay-toggle')
      ).toHaveAttribute('data-on', 'false')
      expect(
        screen.getByTestId('playback-lowlatency-toggle')
      ).toHaveAttribute('data-on', 'true')
    })

    it('should persist settings changes', () => {
      render(<PlaybackSettings testId="playback" />)

      // Make changes
      fireEvent.click(screen.getByTestId('playback-quality-high'))
      fireEvent.click(screen.getByTestId('playback-autoplay-toggle'))
      fireEvent.click(screen.getByTestId('playback-lowlatency-toggle'))

      // Verify store state
      const state = useSettingsStore.getState()
      expect(state.qualityPreference).toBe('high')
      expect(state.autoPlay).toBe(false)
      expect(state.lowLatencyMode).toBe(true)
    })
  })
})
