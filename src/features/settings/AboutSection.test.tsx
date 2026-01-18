import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { AboutSection, APP_NAME, APP_VERSION } from './AboutSection'
import { useSettingsStore } from '../../core/stores/settingsStore'

// Initialize spatial navigation for tests
init({
  debug: false,
  visualDebug: false,
})

describe('AboutSection', () => {
  beforeEach(() => {
    // Reset settings store before each test
    useSettingsStore.getState().resetToDefaults()
  })

  describe('rendering', () => {
    it('renders the about section with title', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('renders app name', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByTestId('about-name')).toHaveTextContent(APP_NAME)
    })

    it('renders app version', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByTestId('about-version')).toHaveTextContent(
        `Version ${APP_VERSION}`
      )
    })

    it('renders app description', () => {
      render(<AboutSection testId="about" />)

      expect(
        screen.getByText(/open-source IPTV player for Hisense\/VIDAA/i)
      ).toBeInTheDocument()
    })

    it('renders technical information section', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('Technical Information')).toBeInTheDocument()
    })

    it('renders platform info', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('VIDAA OS')).toBeInTheDocument()
    })

    it('renders player engine info', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('Player Engine')).toBeInTheDocument()
      expect(screen.getByText('Shaka Player')).toBeInTheDocument()
    })

    it('renders framework info', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('Framework')).toBeInTheDocument()
      expect(screen.getByText('React 18')).toBeInTheDocument()
    })

    it('renders license info', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByText('License')).toBeInTheDocument()
      expect(screen.getByText('Open Source')).toBeInTheDocument()
    })

    it('renders reset button', () => {
      render(<AboutSection testId="about" />)

      expect(
        screen.getByRole('button', { name: /reset all settings/i })
      ).toBeInTheDocument()
    })

    it('renders reset description text', () => {
      render(<AboutSection testId="about" />)

      expect(
        screen.getByText(/reset all settings to their default values/i)
      ).toBeInTheDocument()
    })
  })

  describe('test IDs', () => {
    it('renders with correct test IDs when provided', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByTestId('about')).toBeInTheDocument()
      expect(screen.getByTestId('about-header')).toBeInTheDocument()
      expect(screen.getByTestId('about-name')).toBeInTheDocument()
      expect(screen.getByTestId('about-version')).toBeInTheDocument()
      expect(screen.getByTestId('about-description')).toBeInTheDocument()
      expect(screen.getByTestId('about-info')).toBeInTheDocument()
      expect(screen.getByTestId('about-reset-btn')).toBeInTheDocument()
    })

    it('renders info row test IDs', () => {
      render(<AboutSection testId="about" />)

      expect(screen.getByTestId('about-platform')).toBeInTheDocument()
      expect(screen.getByTestId('about-player')).toBeInTheDocument()
      expect(screen.getByTestId('about-framework')).toBeInTheDocument()
      expect(screen.getByTestId('about-license')).toBeInTheDocument()
    })
  })

  describe('reset functionality', () => {
    it('calls resetToDefaults when reset button is clicked', () => {
      // Modify a setting first
      const store = useSettingsStore.getState()
      store.setQualityPreference('high')
      expect(useSettingsStore.getState().qualityPreference).toBe('high')

      render(<AboutSection testId="about" />)

      const resetButton = screen.getByTestId('about-reset-btn')
      fireEvent.click(resetButton)

      // After reset, quality should be back to default 'auto'
      expect(useSettingsStore.getState().qualityPreference).toBe('auto')
    })

    it('resets all settings to defaults', () => {
      const store = useSettingsStore.getState()

      // Modify multiple settings
      store.setQualityPreference('high')
      store.setBufferSize(60)
      store.setAutoPlay(false)
      store.setLowLatencyMode(true)
      store.setShowChannelLogos(false)

      render(<AboutSection testId="about" />)

      const resetButton = screen.getByTestId('about-reset-btn')
      fireEvent.click(resetButton)

      // Verify all settings are reset to defaults
      const state = useSettingsStore.getState()
      expect(state.qualityPreference).toBe('auto')
      expect(state.bufferSize).toBe(30)
      expect(state.autoPlay).toBe(true)
      expect(state.lowLatencyMode).toBe(false)
      expect(state.showChannelLogos).toBe(true)
    })
  })

  describe('focus states', () => {
    it('renders reset button with focused data attribute', () => {
      render(<AboutSection testId="about" />)

      const resetButton = screen.getByTestId('about-reset-btn')
      expect(resetButton).toHaveAttribute('data-focused')
    })
  })

  describe('constants export', () => {
    it('exports APP_NAME constant', () => {
      expect(APP_NAME).toBe('Ted IPTV Player')
    })

    it('exports APP_VERSION constant', () => {
      expect(APP_VERSION).toBe('0.1.0')
    })
  })
})
