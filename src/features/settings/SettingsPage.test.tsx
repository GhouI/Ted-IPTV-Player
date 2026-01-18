import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { init } from '@noriginmedia/norigin-spatial-navigation'
import { SettingsPage } from './SettingsPage'
import type { Source } from '../../core/types/source'
import { useSettingsStore } from '../../core/stores/settingsStore'

// Initialize spatial navigation before tests
beforeEach(() => {
  init({
    debug: false,
    visualDebug: false,
  })
  // Reset settings store to defaults
  useSettingsStore.getState().resetToDefaults()
})

// Mock sources for testing
const mockSources: Source[] = [
  {
    id: 'xtream-1',
    name: 'My IPTV Provider',
    type: 'xtream',
    serverUrl: 'http://example.com',
    username: 'user1',
    password: 'pass1',
    createdAt: Date.now(),
  },
  {
    id: 'm3u-1',
    name: 'My M3U Playlist',
    type: 'm3u',
    playlistUrl: 'http://example.com/playlist.m3u',
    createdAt: Date.now(),
  },
]

describe('SettingsPage', () => {
  describe('rendering', () => {
    it('should render the settings page with navigation', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Playback')).toBeInTheDocument()
      expect(screen.getByText('Sources')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('should render back button', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    it('should render with test ID', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByTestId('settings')).toBeInTheDocument()
    })

    it('should show playback section by default', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByText('Playback Settings')).toBeInTheDocument()
      expect(screen.getByText('Video Quality')).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn()
      render(<SettingsPage testId="settings" onBack={onBack} />)

      fireEvent.click(screen.getByTestId('settings-back-btn'))
      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('should switch to sources section when clicked', () => {
      render(<SettingsPage testId="settings" sources={mockSources} />)

      fireEvent.click(screen.getByTestId('settings-nav-sources'))

      expect(screen.getByText('IPTV Sources')).toBeInTheDocument()
      expect(screen.getByText('My IPTV Provider')).toBeInTheDocument()
    })

    it('should switch to about section when clicked', () => {
      render(<SettingsPage testId="settings" />)

      fireEvent.click(screen.getByTestId('settings-nav-about'))

      expect(screen.getByText('Ted IPTV Player')).toBeInTheDocument()
      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
    })

    it('should switch back to playback section', () => {
      render(<SettingsPage testId="settings" />)

      // Go to about section first
      fireEvent.click(screen.getByTestId('settings-nav-about'))
      expect(screen.getByText('Ted IPTV Player')).toBeInTheDocument()

      // Switch back to playback
      fireEvent.click(screen.getByTestId('settings-nav-playback'))
      expect(screen.getByText('Playback Settings')).toBeInTheDocument()
    })
  })

  describe('playback section', () => {
    it('should display all playback settings', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByText('Video Quality')).toBeInTheDocument()
      expect(screen.getByText('Buffer Size')).toBeInTheDocument()
      expect(screen.getByText('Auto-Play')).toBeInTheDocument()
      expect(screen.getByText('Low Latency Mode')).toBeInTheDocument()
      expect(screen.getByText('Show Channel Logos')).toBeInTheDocument()
    })

    it('should display quality options', () => {
      render(<SettingsPage testId="settings" />)

      expect(screen.getByText('Auto')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(screen.getByText('Highest')).toBeInTheDocument()
    })

    it('should change quality preference when option is clicked', () => {
      render(<SettingsPage testId="settings" />)

      fireEvent.click(screen.getByTestId('settings-playback-quality-high'))

      expect(useSettingsStore.getState().qualityPreference).toBe('high')
    })

    it('should toggle auto-play setting', () => {
      render(<SettingsPage testId="settings" />)

      const initialAutoPlay = useSettingsStore.getState().autoPlay
      fireEvent.click(screen.getByTestId('settings-playback-autoplay-toggle'))

      expect(useSettingsStore.getState().autoPlay).toBe(!initialAutoPlay)
    })

    it('should toggle low latency mode', () => {
      render(<SettingsPage testId="settings" />)

      const initialLowLatency = useSettingsStore.getState().lowLatencyMode
      fireEvent.click(screen.getByTestId('settings-playback-lowlatency-toggle'))

      expect(useSettingsStore.getState().lowLatencyMode).toBe(!initialLowLatency)
    })

    it('should toggle show channel logos', () => {
      render(<SettingsPage testId="settings" />)

      const initialShowLogos = useSettingsStore.getState().showChannelLogos
      fireEvent.click(screen.getByTestId('settings-playback-logos-toggle'))

      expect(useSettingsStore.getState().showChannelLogos).toBe(!initialShowLogos)
    })
  })

  describe('sources section', () => {
    it('should display empty state when no sources', () => {
      render(<SettingsPage testId="settings" sources={[]} />)

      fireEvent.click(screen.getByTestId('settings-nav-sources'))

      expect(screen.getByText('No Sources Added')).toBeInTheDocument()
      expect(
        screen.getByText('Add an IPTV source to start watching')
      ).toBeInTheDocument()
    })

    it('should display list of sources', () => {
      render(
        <SettingsPage
          testId="settings"
          sources={mockSources}
          activeSourceId="xtream-1"
        />
      )

      fireEvent.click(screen.getByTestId('settings-nav-sources'))

      expect(screen.getByText('My IPTV Provider')).toBeInTheDocument()
      expect(screen.getByText('My M3U Playlist')).toBeInTheDocument()
    })

    it('should show active indicator on active source', () => {
      render(
        <SettingsPage
          testId="settings"
          sources={mockSources}
          activeSourceId="xtream-1"
        />
      )

      fireEvent.click(screen.getByTestId('settings-nav-sources'))

      const activeSource = screen.getByTestId('settings-sources-source-xtream-1')
      expect(activeSource).toHaveAttribute('data-active', 'true')
    })

    it('should display source types correctly', () => {
      render(<SettingsPage testId="settings" sources={mockSources} />)

      fireEvent.click(screen.getByTestId('settings-nav-sources'))

      expect(screen.getByText('Xtream Codes')).toBeInTheDocument()
      expect(screen.getByText('M3U Playlist')).toBeInTheDocument()
    })

    it('should call onSelectSource when source is clicked', () => {
      const onSelectSource = vi.fn()
      render(
        <SettingsPage
          testId="settings"
          sources={mockSources}
          onSelectSource={onSelectSource}
        />
      )

      fireEvent.click(screen.getByTestId('settings-nav-sources'))
      fireEvent.click(screen.getByTestId('settings-sources-source-m3u-1'))

      expect(onSelectSource).toHaveBeenCalledWith(mockSources[1])
    })

    it('should call onAddSource when add button is clicked', () => {
      const onAddSource = vi.fn()
      render(
        <SettingsPage
          testId="settings"
          sources={mockSources}
          onAddSource={onAddSource}
        />
      )

      fireEvent.click(screen.getByTestId('settings-nav-sources'))
      fireEvent.click(screen.getByTestId('settings-sources-add-btn'))

      expect(onAddSource).toHaveBeenCalledTimes(1)
    })
  })

  describe('about section', () => {
    it('should display app info', () => {
      render(<SettingsPage testId="settings" />)

      fireEvent.click(screen.getByTestId('settings-nav-about'))

      expect(screen.getByText('Ted IPTV Player')).toBeInTheDocument()
      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
      expect(
        screen.getByText(/An open-source IPTV player/)
      ).toBeInTheDocument()
    })

    it('should display reset button', () => {
      render(<SettingsPage testId="settings" />)

      fireEvent.click(screen.getByTestId('settings-nav-about'))

      expect(screen.getByText('Reset All Settings')).toBeInTheDocument()
    })

    it('should reset settings when reset button is clicked', () => {
      render(<SettingsPage testId="settings" />)

      // Change a setting first
      useSettingsStore.getState().setQualityPreference('high')
      expect(useSettingsStore.getState().qualityPreference).toBe('high')

      // Go to about and reset
      fireEvent.click(screen.getByTestId('settings-nav-about'))
      fireEvent.click(screen.getByTestId('settings-about-reset-btn'))

      expect(useSettingsStore.getState().qualityPreference).toBe('auto')
    })
  })

  describe('focus states', () => {
    it('should have data-focused attribute on nav items', () => {
      render(<SettingsPage testId="settings" />)

      const playbackNav = screen.getByTestId('settings-nav-playback')
      expect(playbackNav).toHaveAttribute('data-focused')
    })

    it('should have data-selected attribute on active nav item', () => {
      render(<SettingsPage testId="settings" />)

      const playbackNav = screen.getByTestId('settings-nav-playback')
      expect(playbackNav).toHaveAttribute('data-selected', 'true')
    })
  })
})
