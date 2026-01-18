import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useState } from 'react'
import type { Source } from '../../core/types/source'
import {
  useSettingsStore,
  type QualityPreference,
  BUFFER_SIZE_MIN,
  BUFFER_SIZE_MAX,
} from '../../core/stores/settingsStore'

export interface SettingsPageProps {
  /** List of IPTV sources */
  sources?: Source[]
  /** ID of the currently active source */
  activeSourceId?: string | null
  /** Callback when a source is selected */
  onSelectSource?: (source: Source) => void
  /** Callback when a source should be removed */
  onRemoveSource?: (source: Source) => void
  /** Callback when Add Source is clicked */
  onAddSource?: () => void
  /** Callback when back navigation is triggered */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

type SettingsSection = 'playback' | 'sources' | 'about'

interface SettingsNavItemProps {
  label: string
  icon: React.ReactNode
  isSelected: boolean
  focusKey: string
  onSelect: () => void
  testId?: string
}

function SettingsNavItem({
  label,
  icon,
  isSelected,
  focusKey,
  onSelect,
  testId,
}: SettingsNavItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-3',
    'px-4',
    'py-3',
    'rounded-lg',
    'cursor-pointer',
    'transition-all',
    'duration-150',
  ].join(' ')

  const stateClasses = focused
    ? 'bg-tv-accent text-tv-background scale-[1.02] shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : isSelected
      ? 'bg-tv-accent/20 text-tv-accent'
      : 'text-tv-text hover:bg-tv-surface'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      className={`${baseClasses} ${stateClasses}`}
      data-testid={testId}
      data-focused={focused}
      data-selected={isSelected}
    >
      {icon}
      <span className="text-tv-base font-medium">{label}</span>
    </button>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
  testId?: string
}

function SettingRow({ label, description, children, testId }: SettingRowProps) {
  return (
    <div
      className="flex items-center justify-between py-4 border-b border-tv-border last:border-b-0"
      data-testid={testId}
    >
      <div className="flex flex-col">
        <span className="text-tv-base font-medium text-tv-text">{label}</span>
        {description && (
          <span className="text-tv-sm text-tv-text-muted">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

interface SelectOptionProps {
  label: string
  value: string
  isSelected: boolean
  focusKey: string
  onSelect: () => void
  testId?: string
}

function SelectOption({
  label,
  isSelected,
  focusKey,
  onSelect,
  testId,
}: SelectOptionProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  })

  const baseClasses = [
    'px-4',
    'py-2',
    'rounded-lg',
    'cursor-pointer',
    'transition-all',
    'duration-150',
    'text-tv-sm',
    'font-medium',
  ].join(' ')

  const stateClasses = focused
    ? 'bg-tv-accent text-tv-background scale-105 shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : isSelected
      ? 'bg-tv-accent/20 text-tv-accent'
      : 'bg-tv-surface text-tv-text hover:bg-tv-card'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      className={`${baseClasses} ${stateClasses}`}
      data-testid={testId}
      data-focused={focused}
      data-selected={isSelected}
    >
      {label}
    </button>
  )
}

interface ToggleSwitchProps {
  isOn: boolean
  focusKey: string
  onToggle: () => void
  testId?: string
}

function ToggleSwitch({ isOn, focusKey, onToggle, testId }: ToggleSwitchProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onToggle,
  })

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      className={`relative w-14 h-8 rounded-full transition-all duration-150 ${
        focused
          ? 'shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
          : ''
      } ${isOn ? 'bg-tv-accent' : 'bg-tv-surface'}`}
      data-testid={testId}
      data-focused={focused}
      data-on={isOn}
      aria-pressed={isOn}
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform duration-150 ${
          isOn ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  focusKey: string
  onChange: (value: number) => void
  testId?: string
}

function Slider({
  value,
  min,
  max,
  step = 1,
  focusKey,
  onChange,
  testId,
}: SliderProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onArrowPress: (direction) => {
      if (direction === 'left') {
        onChange(Math.max(min, value - step))
        return false
      } else if (direction === 'right') {
        onChange(Math.min(max, value + step))
        return false
      }
      return true
    },
  })

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={`relative w-32 h-2 rounded-full bg-tv-surface cursor-pointer ${
        focused
          ? 'shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
          : ''
      }`}
      data-testid={testId}
      data-focused={focused}
    >
      <div
        className="absolute top-0 left-0 h-full rounded-full bg-tv-accent transition-all"
        style={{ width: `${percentage}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  )
}

// Icons for settings navigation
const PlaybackIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const SourcesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
)

const AboutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

interface PlaybackSectionProps {
  testId?: string
}

function PlaybackSection({ testId }: PlaybackSectionProps) {
  const {
    qualityPreference,
    setQualityPreference,
    bufferSize,
    setBufferSize,
    autoPlay,
    setAutoPlay,
    lowLatencyMode,
    setLowLatencyMode,
    showChannelLogos,
    setShowChannelLogos,
  } = useSettingsStore()

  const qualityOptions: { label: string; value: QualityPreference }[] = [
    { label: 'Auto', value: 'auto' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Highest', value: 'highest' },
  ]

  return (
    <div data-testid={testId}>
      <h2 className="text-tv-xl font-bold text-tv-text mb-6">
        Playback Settings
      </h2>

      <div className="bg-tv-card rounded-xl p-6">
        <SettingRow
          label="Video Quality"
          description="Select preferred streaming quality"
          testId={testId ? `${testId}-quality-row` : undefined}
        >
          <div className="flex gap-2">
            {qualityOptions.map((option) => (
              <SelectOption
                key={option.value}
                label={option.label}
                value={option.value}
                isSelected={qualityPreference === option.value}
                focusKey={`quality-${option.value}`}
                onSelect={() => setQualityPreference(option.value)}
                testId={
                  testId ? `${testId}-quality-${option.value}` : undefined
                }
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Buffer Size"
          description={`${bufferSize} seconds`}
          testId={testId ? `${testId}-buffer-row` : undefined}
        >
          <Slider
            value={bufferSize}
            min={BUFFER_SIZE_MIN}
            max={BUFFER_SIZE_MAX}
            step={5}
            focusKey="buffer-slider"
            onChange={setBufferSize}
            testId={testId ? `${testId}-buffer-slider` : undefined}
          />
        </SettingRow>

        <SettingRow
          label="Auto-Play"
          description="Automatically start playback"
          testId={testId ? `${testId}-autoplay-row` : undefined}
        >
          <ToggleSwitch
            isOn={autoPlay}
            focusKey="autoplay-toggle"
            onToggle={() => setAutoPlay(!autoPlay)}
            testId={testId ? `${testId}-autoplay-toggle` : undefined}
          />
        </SettingRow>

        <SettingRow
          label="Low Latency Mode"
          description="Reduce delay for live streams"
          testId={testId ? `${testId}-lowlatency-row` : undefined}
        >
          <ToggleSwitch
            isOn={lowLatencyMode}
            focusKey="lowlatency-toggle"
            onToggle={() => setLowLatencyMode(!lowLatencyMode)}
            testId={testId ? `${testId}-lowlatency-toggle` : undefined}
          />
        </SettingRow>

        <SettingRow
          label="Show Channel Logos"
          description="Display logos in channel list"
          testId={testId ? `${testId}-logos-row` : undefined}
        >
          <ToggleSwitch
            isOn={showChannelLogos}
            focusKey="logos-toggle"
            onToggle={() => setShowChannelLogos(!showChannelLogos)}
            testId={testId ? `${testId}-logos-toggle` : undefined}
          />
        </SettingRow>
      </div>
    </div>
  )
}

interface SourcesSectionProps {
  sources: Source[]
  activeSourceId?: string | null
  onSelectSource?: (source: Source) => void
  onRemoveSource?: (source: Source) => void
  onAddSource?: () => void
  testId?: string
}

function SourcesSection({
  sources,
  activeSourceId,
  onSelectSource,
  onRemoveSource,
  onAddSource,
  testId,
}: SourcesSectionProps) {
  const handleSelectSource = useCallback(
    (source: Source) => {
      onSelectSource?.(source)
    },
    [onSelectSource]
  )

  const handleRemoveSource = useCallback(
    (source: Source, e: React.MouseEvent) => {
      e.stopPropagation()
      onRemoveSource?.(source)
    },
    [onRemoveSource]
  )

  return (
    <div data-testid={testId}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-tv-xl font-bold text-tv-text">IPTV Sources</h2>
        <AddSourceButton
          onClick={() => onAddSource?.()}
          focusKey="add-source-btn"
          testId={testId ? `${testId}-add-btn` : undefined}
        />
      </div>

      {sources.length === 0 ? (
        <div className="bg-tv-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tv-surface flex items-center justify-center">
            <SourcesIcon />
          </div>
          <h3 className="text-tv-lg font-semibold text-tv-text mb-2">
            No Sources Added
          </h3>
          <p className="text-tv-text-muted">
            Add an IPTV source to start watching
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              isActive={source.id === activeSourceId}
              focusKey={`source-${source.id}`}
              onSelect={() => handleSelectSource(source)}
              onRemove={(e) => handleRemoveSource(source, e)}
              testId={testId ? `${testId}-source-${source.id}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SourceItemProps {
  source: Source
  isActive: boolean
  focusKey: string
  onSelect: () => void
  onRemove: (e: React.MouseEvent) => void
  testId?: string
}

function SourceItem({
  source,
  isActive,
  focusKey,
  onSelect,
  onRemove,
  testId,
}: SourceItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  })

  const isXtream = source.type === 'xtream'

  const baseClasses = [
    'flex',
    'items-center',
    'justify-between',
    'p-4',
    'rounded-xl',
    'bg-tv-card',
    'border-2',
    'cursor-pointer',
    'transition-all',
    'duration-150',
  ].join(' ')

  const stateClasses = focused
    ? 'border-tv-accent scale-[1.01] shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
    : isActive
      ? 'border-tv-accent/50 bg-tv-accent/10'
      : 'border-tv-border hover:border-tv-accent/50'

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`${baseClasses} ${stateClasses}`}
      data-testid={testId}
      data-focused={focused}
      data-active={isActive}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-tv-surface flex items-center justify-center">
          {isXtream ? (
            <svg
              className="w-5 h-5 text-tv-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-tv-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>
        <div>
          <div className="text-tv-base font-medium text-tv-text">
            {source.name}
          </div>
          <div className="text-tv-sm text-tv-text-muted">
            {isXtream ? 'Xtream Codes' : 'M3U Playlist'}
            {isActive && ' • Active'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="px-3 py-1 rounded-full bg-tv-accent/20 text-tv-accent text-tv-sm font-medium">
            Active
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-lg bg-tv-surface flex items-center justify-center text-tv-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors"
          aria-label={`Remove ${source.name}`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface AddSourceButtonProps {
  onClick: () => void
  focusKey: string
  testId?: string
}

function AddSourceButton({ onClick, focusKey, testId }: AddSourceButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
  })

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
        focused
          ? 'bg-tv-accent text-tv-background scale-105 shadow-[0_0_0_2px_var(--color-tv-accent),0_0_20px_var(--color-tv-accent-glow)]'
          : 'bg-tv-accent/80 text-tv-background hover:bg-tv-accent'
      }`}
      data-testid={testId}
      data-focused={focused}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Add Source
    </button>
  )
}

interface AboutSectionProps {
  testId?: string
}

function AboutSection({ testId }: AboutSectionProps) {
  const { resetToDefaults } = useSettingsStore()
  const { ref: resetRef, focused: resetFocused } = useFocusable({
    focusKey: 'reset-settings',
    onEnterPress: resetToDefaults,
  })

  return (
    <div data-testid={testId}>
      <h2 className="text-tv-xl font-bold text-tv-text mb-6">About</h2>

      <div className="bg-tv-card rounded-xl p-6 space-y-4">
        <div className="text-center pb-4 border-b border-tv-border">
          <h3 className="text-tv-2xl font-bold text-tv-text mb-1">
            Ted IPTV Player
          </h3>
          <p className="text-tv-text-muted">Version 1.0.0</p>
        </div>

        <div className="space-y-3 text-tv-text-muted text-tv-sm">
          <p>
            An open-source IPTV player for Hisense/VIDAA smart TVs. Watch live
            TV, movies, and series from your IPTV provider.
          </p>
          <p>Built with React, TypeScript, and Shaka Player.</p>
        </div>

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
        </div>
      </div>
    </div>
  )
}

/**
 * SettingsPage - Settings screen with sections for playback and sources.
 *
 * Features:
 * - Left navigation sidebar with section selection
 * - Playback settings (quality, buffer, auto-play, etc.)
 * - IPTV source management
 * - About section with app info and reset option
 * - TV-optimized navigation with spatial navigation support
 */
export function SettingsPage({
  sources = [],
  activeSourceId,
  onSelectSource,
  onRemoveSource,
  onAddSource,
  onBack,
  testId,
}: SettingsPageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'SETTINGS_PAGE',
    isFocusBoundary: true,
  })

  const [activeSection, setActiveSection] = useState<SettingsSection>('playback')

  const handleNavSelect = useCallback((section: SettingsSection) => {
    setActiveSection(section)
  }, [])

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Navigation sidebar */}
        <aside className="w-64 flex-shrink-0 bg-tv-surface border-r border-tv-border p-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-tv-text-muted hover:text-tv-text mb-6 transition-colors"
            data-testid={testId ? `${testId}-back-btn` : undefined}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <h1 className="text-tv-lg font-semibold text-tv-text mb-4">
            Settings
          </h1>

          <nav className="space-y-2">
            <SettingsNavItem
              label="Playback"
              icon={<PlaybackIcon />}
              isSelected={activeSection === 'playback'}
              focusKey="nav-playback"
              onSelect={() => handleNavSelect('playback')}
              testId={testId ? `${testId}-nav-playback` : undefined}
            />
            <SettingsNavItem
              label="Sources"
              icon={<SourcesIcon />}
              isSelected={activeSection === 'sources'}
              focusKey="nav-sources"
              onSelect={() => handleNavSelect('sources')}
              testId={testId ? `${testId}-nav-sources` : undefined}
            />
            <SettingsNavItem
              label="About"
              icon={<AboutIcon />}
              isSelected={activeSection === 'about'}
              focusKey="nav-about"
              onSelect={() => handleNavSelect('about')}
              testId={testId ? `${testId}-nav-about` : undefined}
            />
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeSection === 'playback' && (
            <PlaybackSection
              testId={testId ? `${testId}-playback` : undefined}
            />
          )}
          {activeSection === 'sources' && (
            <SourcesSection
              sources={sources}
              activeSourceId={activeSourceId}
              onSelectSource={onSelectSource}
              onRemoveSource={onRemoveSource}
              onAddSource={onAddSource}
              testId={testId ? `${testId}-sources` : undefined}
            />
          )}
          {activeSection === 'about' && (
            <AboutSection testId={testId ? `${testId}-about` : undefined} />
          )}
        </main>
      </div>
    </FocusContext.Provider>
  )
}
