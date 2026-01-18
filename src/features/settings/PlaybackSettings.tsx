import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import {
  useSettingsStore,
  type QualityPreference,
  BUFFER_SIZE_MIN,
  BUFFER_SIZE_MAX,
} from '../../core/stores/settingsStore'

export interface PlaybackSettingsProps {
  /** Test ID for testing purposes */
  testId?: string
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
      data-value={value}
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

/**
 * PlaybackSettings - Component for configuring playback-related settings.
 *
 * Features:
 * - Video quality selection (auto, low, medium, high, highest)
 * - Buffer size adjustment with slider
 * - Auto-play toggle
 * - Low latency mode toggle for live streams
 * - Channel logos visibility toggle
 * - TV-optimized controls with spatial navigation support
 */
export function PlaybackSettings({ testId }: PlaybackSettingsProps) {
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
                focusKey={`playback-quality-${option.value}`}
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
            focusKey="playback-buffer-slider"
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
            focusKey="playback-autoplay-toggle"
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
            focusKey="playback-lowlatency-toggle"
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
            focusKey="playback-logos-toggle"
            onToggle={() => setShowChannelLogos(!showChannelLogos)}
            testId={testId ? `${testId}-logos-toggle` : undefined}
          />
        </SettingRow>
      </div>
    </div>
  )
}
