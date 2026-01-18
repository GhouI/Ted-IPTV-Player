import { useCallback } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { QualityTrack } from '../../core/types/player'
import { usePlayerStore } from '../../core/stores/playerStore'

export interface QualitySelectorProps {
  /** Callback when a quality is selected */
  onQualityChange?: (quality: QualityTrack | null) => void
  /** Whether the selector is visible */
  visible?: boolean
  /** Callback when selector is closed */
  onClose?: () => void
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats bitrate to human-readable format (e.g., "5.2 Mbps")
 */
function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`
  }
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`
  }
  return `${bitrate} bps`
}

/**
 * QualitySelector - Stream quality selection component for video player.
 *
 * Features:
 * - Displays available quality tracks from player store
 * - Auto quality option at the top
 * - Shows resolution (e.g., 1080p) and bitrate for each option
 * - TV remote navigation support via spatial navigation
 * - Highlights currently selected quality
 * - Closes when quality is selected or back is pressed
 */
export function QualitySelector({
  onQualityChange,
  visible = true,
  onClose,
  className = '',
  testId,
}: QualitySelectorProps) {
  const {
    qualityTracks,
    selectedQuality,
    isAutoQuality,
  } = usePlayerStore()

  const { ref: containerRef, focusKey } = useFocusable({
    focusKey: 'quality-selector',
    trackChildren: true,
    saveLastFocusedChild: true,
    isFocusBoundary: true,
  })

  // Handle quality selection
  const handleSelectQuality = useCallback((quality: QualityTrack | null) => {
    onQualityChange?.(quality)
    onClose?.()
  }, [onQualityChange, onClose])

  // Container classes
  const containerClasses = [
    'absolute',
    'right-4',
    'bottom-24',
    'bg-black/90',
    'backdrop-blur-md',
    'rounded-lg',
    'overflow-hidden',
    'min-w-[200px]',
    'max-h-[300px]',
    'overflow-y-auto',
    'transition-all',
    'duration-200',
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
    className,
  ].filter(Boolean).join(' ')

  // Sort quality tracks by height (highest first)
  const sortedTracks = [...qualityTracks].sort((a, b) => b.height - a.height)

  if (!visible) {
    return null
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={containerRef}
        className={containerClasses}
        data-testid={testId}
        data-visible={visible}
        role="menu"
        aria-label="Quality selection"
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10">
          <span className="text-sm font-medium text-white/70">Quality</span>
        </div>

        {/* Quality Options */}
        <div className="py-1">
          {/* Auto option */}
          <QualityOption
            label="Auto"
            description="Automatic quality selection"
            isSelected={isAutoQuality}
            onSelect={() => handleSelectQuality(null)}
            testId={testId ? `${testId}-auto` : undefined}
          />

          {/* Individual quality options */}
          {sortedTracks.map((track) => (
            <QualityOption
              key={track.id}
              label={track.label}
              description={formatBitrate(track.bitrate)}
              resolution={`${track.width}x${track.height}`}
              isSelected={!isAutoQuality && selectedQuality?.id === track.id}
              onSelect={() => handleSelectQuality(track)}
              testId={testId ? `${testId}-${track.height}p` : undefined}
            />
          ))}

          {/* Empty state */}
          {sortedTracks.length === 0 && (
            <div className="px-4 py-3 text-sm text-white/50">
              No quality options available
            </div>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

interface QualityOptionProps {
  label: string
  description?: string
  resolution?: string
  isSelected: boolean
  onSelect: () => void
  testId?: string
}

function QualityOption({
  label,
  description,
  resolution,
  isSelected,
  onSelect,
  testId,
}: QualityOptionProps) {
  const { ref, focused } = useFocusable({
    focusKey: `quality-option-${label}`,
    onEnterPress: onSelect,
  })

  const optionClasses = [
    'flex',
    'items-center',
    'justify-between',
    'w-full',
    'px-4',
    'py-3',
    'text-left',
    'transition-colors',
    'duration-100',
    focused ? 'bg-tv-accent text-white' : 'text-white/90 hover:bg-white/10',
  ].join(' ')

  return (
    <button
      ref={ref}
      className={optionClasses}
      onClick={onSelect}
      data-testid={testId}
      data-focused={focused}
      data-selected={isSelected}
      role="menuitem"
      aria-checked={isSelected}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className={[
            'text-xs',
            focused ? 'text-white/80' : 'text-white/50',
          ].join(' ')}>
            {description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {resolution && (
          <span className={[
            'text-xs',
            focused ? 'text-white/80' : 'text-white/40',
          ].join(' ')}>
            {resolution}
          </span>
        )}

        {/* Checkmark for selected option */}
        {isSelected && (
          <CheckIcon className={focused ? 'text-white' : 'text-tv-accent'} />
        )}
      </div>
    </button>
  )
}

// ============================================================================
// Icons
// ============================================================================

interface IconProps {
  className?: string
}

function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}
