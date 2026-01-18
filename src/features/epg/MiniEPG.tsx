import { useMemo } from 'react'
import type { Channel, Program } from '../../core/types/channel'
import { useEPGStore } from '../../core/stores/epgStore'

export interface MiniEPGProps {
  /** The channel to show EPG info for */
  channel: Channel
  /** Optional class name for styling */
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
 * MiniEPG - A compact EPG overlay showing now/next programs for the current channel.
 *
 * Features:
 * - Shows currently airing program with progress bar
 * - Displays the next upcoming program
 * - Compact design for overlay on video player
 * - Works with EPG store data
 */
export function MiniEPG({ channel, className = '', testId }: MiniEPGProps) {
  const getCurrentProgram = useEPGStore((state) => state.getCurrentProgram)
  const getNextProgram = useEPGStore((state) => state.getNextProgram)

  const channelId = channel.epgChannelId || channel.id

  const currentProgram = useMemo(
    () => getCurrentProgram(channelId),
    [getCurrentProgram, channelId]
  )

  const nextProgram = useMemo(
    () => getNextProgram(channelId),
    [getNextProgram, channelId]
  )

  const progress = useMemo(
    () => (currentProgram ? calculateProgress(currentProgram) : 0),
    [currentProgram]
  )

  return (
    <div
      className={`bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-64 ${className}`}
      data-testid={testId}
    >
      {/* Channel info */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
        {channel.logo && (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-8 h-8 object-contain rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-tv-sm truncate">
            {channel.number !== undefined && (
              <span className="text-tv-text-muted mr-1">{channel.number}.</span>
            )}
            {channel.name}
          </p>
        </div>
      </div>

      {/* Now playing */}
      <div className="mb-3" data-testid={testId ? `${testId}-now` : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-tv-error animate-pulse" />
          <span className="text-tv-xs text-tv-text-muted uppercase font-medium">Now</span>
        </div>
        {currentProgram ? (
          <>
            <p className="text-white text-tv-sm font-medium truncate mb-1">
              {currentProgram.title}
            </p>
            <div className="flex items-center gap-2 text-tv-xs text-tv-text-muted mb-1">
              <span>{formatTime(currentProgram.startTime)} - {formatTime(currentProgram.endTime)}</span>
              <span>•</span>
              <span>{formatRemainingTime(currentProgram)}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-tv-accent rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
                data-testid={testId ? `${testId}-progress` : undefined}
              />
            </div>
          </>
        ) : (
          <p className="text-tv-text-muted text-tv-xs italic">No program info available</p>
        )}
      </div>

      {/* Next program */}
      <div data-testid={testId ? `${testId}-next` : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-tv-xs text-tv-text-muted uppercase font-medium">Next</span>
        </div>
        {nextProgram ? (
          <>
            <p className="text-white/80 text-tv-sm truncate">
              {nextProgram.title}
            </p>
            <p className="text-tv-xs text-tv-text-muted">
              {formatTime(nextProgram.startTime)}
            </p>
          </>
        ) : (
          <p className="text-tv-text-muted text-tv-xs italic">No upcoming program</p>
        )}
      </div>
    </div>
  )
}
