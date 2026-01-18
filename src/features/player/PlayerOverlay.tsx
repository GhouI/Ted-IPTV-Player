import { useEffect, useState, useMemo, useCallback } from 'react'
import type { Channel, Program } from '../../core/types/channel'
import { useEPGStore } from '../../core/stores/epgStore'

export interface PlayerOverlayProps {
  /** The channel currently being played */
  channel: Channel | null
  /** Whether the overlay should be visible */
  visible?: boolean
  /** Duration in ms before auto-hiding (0 = never auto-hide) */
  autoHideDelay?: number
  /** Callback when overlay visibility changes */
  onVisibilityChange?: (visible: boolean) => void
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats a timestamp for display (HH:MM format)
 */
function formatTime(time: string | number): string {
  const date = new Date(typeof time === 'number' ? time : time)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calculates the progress percentage of a program
 */
function calculateProgress(program: Program): number {
  const now = Date.now()
  const start = typeof program.startTime === 'number'
    ? program.startTime
    : new Date(program.startTime).getTime()
  const end = typeof program.endTime === 'number'
    ? program.endTime
    : new Date(program.endTime).getTime()

  const duration = end - start
  if (duration <= 0) return 0

  const elapsed = now - start
  return Math.max(0, Math.min(100, (elapsed / duration) * 100))
}

/**
 * Formats remaining time in a human-readable format
 */
function formatRemainingTime(program: Program): string {
  const now = Date.now()
  const end = typeof program.endTime === 'number'
    ? program.endTime
    : new Date(program.endTime).getTime()

  const remainingMs = end - now
  if (remainingMs <= 0) return 'Ending'

  const remainingMinutes = Math.ceil(remainingMs / 60000)
  if (remainingMinutes < 60) {
    return `${remainingMinutes}min left`
  }

  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  return `${hours}h ${minutes}min left`
}

/**
 * PlayerOverlay - Displays channel information overlay on the video player.
 *
 * Features:
 * - Shows channel logo, number, and name
 * - Displays current program info with progress bar
 * - Shows next program preview
 * - Auto-hides after configurable delay
 * - Smooth fade in/out animations
 * - Works with channel and EPG store data
 */
export function PlayerOverlay({
  channel,
  visible = true,
  autoHideDelay = 5000,
  onVisibilityChange,
  className = '',
  testId,
}: PlayerOverlayProps) {
  const [isVisible, setIsVisible] = useState(visible)

  // Get EPG functions from store
  const getCurrentProgram = useEPGStore((state) => state.getCurrentProgram)
  const getNextProgram = useEPGStore((state) => state.getNextProgram)

  // Get channel EPG ID
  const channelId = channel?.epgChannelId || channel?.id || ''

  // Get current and next programs
  const currentProgram = useMemo(
    () => (channelId ? getCurrentProgram(channelId) : undefined),
    [getCurrentProgram, channelId]
  )

  const nextProgram = useMemo(
    () => (channelId ? getNextProgram(channelId) : undefined),
    [getNextProgram, channelId]
  )

  // Calculate progress for current program
  const progress = useMemo(
    () => (currentProgram ? calculateProgress(currentProgram) : 0),
    [currentProgram]
  )

  // Handle visibility changes
  const handleVisibilityChange = useCallback(
    (newVisible: boolean) => {
      setIsVisible(newVisible)
      onVisibilityChange?.(newVisible)
    },
    [onVisibilityChange]
  )

  // Sync with external visible prop
  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  // Auto-hide logic
  useEffect(() => {
    if (!isVisible || autoHideDelay <= 0) return

    const timer = setTimeout(() => {
      handleVisibilityChange(false)
    }, autoHideDelay)

    return () => clearTimeout(timer)
  }, [isVisible, autoHideDelay, handleVisibilityChange])

  // Don't render if no channel
  if (!channel) {
    return null
  }

  const containerClasses = [
    'absolute',
    'top-0',
    'left-0',
    'right-0',
    'bg-gradient-to-b',
    'from-black/90',
    'via-black/60',
    'to-transparent',
    'px-6',
    'pt-6',
    'pb-20',
    'transition-opacity',
    'duration-300',
    isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      data-visible={isVisible}
    >
      {/* Channel Info Row */}
      <div className="flex items-center gap-4 mb-4">
        {/* Channel Logo */}
        {channel.logo && (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-16 h-16 object-contain rounded-lg bg-white/10"
            data-testid={testId ? `${testId}-logo` : undefined}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}

        {/* Channel Name and Number */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            {channel.number !== undefined && (
              <span
                className="text-3xl font-bold text-tv-accent"
                data-testid={testId ? `${testId}-number` : undefined}
              >
                {channel.number}
              </span>
            )}
            <h2
              className="text-2xl font-semibold text-white truncate"
              data-testid={testId ? `${testId}-name` : undefined}
            >
              {channel.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Program Info Section */}
      <div className="max-w-xl">
        {/* Current Program */}
        <div className="mb-3" data-testid={testId ? `${testId}-current-program` : undefined}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white/60 uppercase font-medium tracking-wide">
              Now Playing
            </span>
          </div>

          {currentProgram ? (
            <>
              <h3
                className="text-lg font-medium text-white truncate mb-1"
                data-testid={testId ? `${testId}-current-title` : undefined}
              >
                {currentProgram.title}
              </h3>

              <div className="flex items-center gap-3 text-sm text-white/70 mb-2">
                <span data-testid={testId ? `${testId}-current-time` : undefined}>
                  {formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}
                </span>
                <span className="text-white/40">|</span>
                <span data-testid={testId ? `${testId}-current-remaining` : undefined}>
                  {formatRemainingTime(currentProgram)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-tv-accent rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                  data-testid={testId ? `${testId}-progress` : undefined}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-white/50 italic">
              No program information available
            </p>
          )}
        </div>

        {/* Next Program */}
        {nextProgram && (
          <div
            className="pt-2 border-t border-white/10"
            data-testid={testId ? `${testId}-next-program` : undefined}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/50 uppercase text-xs font-medium">Next:</span>
              <span
                className="text-white/80 truncate"
                data-testid={testId ? `${testId}-next-title` : undefined}
              >
                {nextProgram.title}
              </span>
              <span className="text-white/50 ml-auto">
                {formatTime(nextProgram.startTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
