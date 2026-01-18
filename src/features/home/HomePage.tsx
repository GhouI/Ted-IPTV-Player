import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import { MenuCard } from './MenuCard'

export interface HomePageProps {
  /** Callback when Live TV is selected */
  onNavigateLiveTV?: () => void
  /** Callback when VOD is selected */
  onNavigateVOD?: () => void
  /** Callback when Series is selected */
  onNavigateSeries?: () => void
  /** Callback when EPG is selected */
  onNavigateEPG?: () => void
  /** Callback when Settings is selected */
  onNavigateSettings?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

// SVG icons for menu items
const LiveTVIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12"
    aria-hidden="true"
  >
    <path d="M4 6h16v12H4V6zm0-2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4zm9.5 11l-5-3v6l5-3z" />
  </svg>
)

const VODIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12"
    aria-hidden="true"
  >
    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
  </svg>
)

const SeriesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12"
    aria-hidden="true"
  >
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
  </svg>
)

const EPGIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12"
    aria-hidden="true"
  >
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12"
    aria-hidden="true"
  >
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
)

/**
 * HomePage - Main menu screen for the IPTV player.
 *
 * Features:
 * - Grid layout with 5 main navigation options
 * - TV-optimized navigation with spatial navigation support
 * - Large, easy-to-focus menu cards
 * - Navigation callbacks for routing to different sections
 */
export function HomePage({
  onNavigateLiveTV,
  onNavigateVOD,
  onNavigateSeries,
  onNavigateEPG,
  onNavigateSettings,
  testId,
}: HomePageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'HOME_PAGE',
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
  })

  const handleLiveTVSelect = useCallback(() => {
    onNavigateLiveTV?.()
  }, [onNavigateLiveTV])

  const handleVODSelect = useCallback(() => {
    onNavigateVOD?.()
  }, [onNavigateVOD])

  const handleSeriesSelect = useCallback(() => {
    onNavigateSeries?.()
  }, [onNavigateSeries])

  const handleEPGSelect = useCallback(() => {
    onNavigateEPG?.()
  }, [onNavigateEPG])

  const handleSettingsSelect = useCallback(() => {
    onNavigateSettings?.()
  }, [onNavigateSettings])

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex flex-col items-center justify-center min-h-screen bg-tv-bg p-8"
        data-testid={testId}
      >
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-tv-4xl font-bold text-tv-text mb-2">
            Ted IPTV Player
          </h1>
          <p className="text-tv-lg text-tv-text-muted">
            Select an option to get started
          </p>
        </header>

        {/* Main Menu Grid */}
        <nav
          className="grid grid-cols-5 gap-6 max-w-6xl"
          role="navigation"
          aria-label="Main menu"
        >
          <MenuCard
            focusKey="MENU_LIVE_TV"
            title="Live TV"
            icon={<LiveTVIcon />}
            description="Watch live channels"
            onSelect={handleLiveTVSelect}
            testId="menu-live-tv"
          />
          <MenuCard
            focusKey="MENU_VOD"
            title="Movies"
            icon={<VODIcon />}
            description="Browse movies"
            onSelect={handleVODSelect}
            testId="menu-vod"
          />
          <MenuCard
            focusKey="MENU_SERIES"
            title="Series"
            icon={<SeriesIcon />}
            description="Watch TV series"
            onSelect={handleSeriesSelect}
            testId="menu-series"
          />
          <MenuCard
            focusKey="MENU_EPG"
            title="TV Guide"
            icon={<EPGIcon />}
            description="Program schedule"
            onSelect={handleEPGSelect}
            testId="menu-epg"
          />
          <MenuCard
            focusKey="MENU_SETTINGS"
            title="Settings"
            icon={<SettingsIcon />}
            description="Configure app"
            onSelect={handleSettingsSelect}
            testId="menu-settings"
          />
        </nav>

        {/* Footer */}
        <footer className="mt-12 text-center text-tv-text-muted text-tv-sm">
          <p>Use arrow keys to navigate, OK to select</p>
        </footer>
      </div>
    </FocusContext.Provider>
  )
}
