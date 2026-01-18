import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useSettingsStore } from '../../core/stores/settingsStore'

/** Application version - should match package.json */
export const APP_VERSION = '0.1.0'

/** Application name */
export const APP_NAME = 'Ted IPTV Player'

export interface AboutSectionProps {
  /** Test ID for testing purposes */
  testId?: string
}

interface InfoRowProps {
  label: string
  value: string
  testId?: string
}

function InfoRow({ label, value, testId }: InfoRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-tv-border last:border-b-0"
      data-testid={testId}
    >
      <span className="text-tv-base text-tv-text-muted">{label}</span>
      <span className="text-tv-base font-medium text-tv-text">{value}</span>
    </div>
  )
}

/**
 * AboutSection - Component displaying app version info and settings reset.
 *
 * Features:
 * - App name and version display
 * - App description
 * - Technical stack information
 * - Reset all settings button
 * - TV-optimized controls with spatial navigation support
 */
export function AboutSection({ testId }: AboutSectionProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'ABOUT_SECTION',
    isFocusBoundary: false,
  })

  const { resetToDefaults } = useSettingsStore()

  const { ref: resetRef, focused: resetFocused } = useFocusable({
    focusKey: 'about-reset-settings',
    onEnterPress: resetToDefaults,
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} data-testid={testId}>
        <h2 className="text-tv-xl font-bold text-tv-text mb-6">About</h2>

        <div className="bg-tv-card rounded-xl p-6 space-y-6">
          {/* App header with name and version */}
          <div
            className="text-center pb-6 border-b border-tv-border"
            data-testid={testId ? `${testId}-header` : undefined}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-tv-accent/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-tv-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3
              className="text-tv-2xl font-bold text-tv-text mb-1"
              data-testid={testId ? `${testId}-name` : undefined}
            >
              {APP_NAME}
            </h3>
            <p
              className="text-tv-text-muted"
              data-testid={testId ? `${testId}-version` : undefined}
            >
              Version {APP_VERSION}
            </p>
          </div>

          {/* App description */}
          <div
            className="space-y-3 text-tv-text-muted text-tv-sm"
            data-testid={testId ? `${testId}-description` : undefined}
          >
            <p>
              An open-source IPTV player for Hisense/VIDAA smart TVs. Watch live
              TV, movies, and series from your IPTV provider.
            </p>
            <p>Built with React, TypeScript, and Shaka Player.</p>
          </div>

          {/* Technical info */}
          <div
            className="pt-4 border-t border-tv-border"
            data-testid={testId ? `${testId}-info` : undefined}
          >
            <h4 className="text-tv-base font-semibold text-tv-text mb-3">
              Technical Information
            </h4>
            <div className="bg-tv-surface rounded-lg p-4">
              <InfoRow
                label="Platform"
                value="VIDAA OS"
                testId={testId ? `${testId}-platform` : undefined}
              />
              <InfoRow
                label="Player Engine"
                value="Shaka Player"
                testId={testId ? `${testId}-player` : undefined}
              />
              <InfoRow
                label="Framework"
                value="React 18"
                testId={testId ? `${testId}-framework` : undefined}
              />
              <InfoRow
                label="License"
                value="Open Source"
                testId={testId ? `${testId}-license` : undefined}
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-tv-border">
            <button
              ref={resetRef}
              type="button"
              onClick={resetToDefaults}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-150 ${
                resetFocused
                  ? 'bg-red-500 text-white scale-[1.02] shadow-[0_0_0_2px_#ef4444,0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-tv-surface text-tv-text hover:bg-red-500/20 hover:text-red-400'
              }`}
              data-testid={testId ? `${testId}-reset-btn` : undefined}
              data-focused={resetFocused}
            >
              Reset All Settings
            </button>
            <p className="text-tv-sm text-tv-text-muted text-center mt-2">
              This will reset all settings to their default values
            </p>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
