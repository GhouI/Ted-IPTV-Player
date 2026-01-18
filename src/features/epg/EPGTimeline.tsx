import { useMemo } from 'react'

export interface EPGTimelineProps {
  /** Array of time slot start times (Unix timestamps in ms) */
  timeSlots: number[]
  /** Start time of the current time window */
  timeWindowStart: number
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats a timestamp to display time (e.g., "14:00", "14:30")
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * EPGTimeline - Displays the time header for the EPG grid.
 *
 * Features:
 * - Shows time slots in 30-minute intervals
 * - Highlights the current time position
 * - Fixed header that scrolls with the grid
 */
export function EPGTimeline({
  timeSlots,
  timeWindowStart,
  testId,
}: EPGTimelineProps) {
  const now = Date.now()

  // Calculate if "now" is within the visible window
  const nowPosition = useMemo(() => {
    const timeWindowEnd = timeSlots[timeSlots.length - 1] + 30 * 60 * 1000
    if (now < timeWindowStart || now > timeWindowEnd) {
      return null
    }
    // Calculate percentage position
    const totalMs = timeWindowEnd - timeWindowStart
    const offsetMs = now - timeWindowStart
    return (offsetMs / totalMs) * 100
  }, [now, timeWindowStart, timeSlots])

  return (
    <div
      className="flex h-10 border-b border-tv-border bg-tv-surface relative"
      data-testid={testId}
      role="row"
      aria-label="Time slots"
    >
      {/* Empty space for channel list alignment */}
      <div
        className="w-48 flex-shrink-0 border-r border-tv-border flex items-center px-3"
        aria-hidden="true"
      >
        <span className="text-tv-sm text-tv-text-muted">Channel</span>
      </div>

      {/* Time slots */}
      <div className="flex-1 flex relative overflow-hidden">
        {timeSlots.map((slot, index) => (
          <div
            key={slot}
            className="flex-1 flex items-center justify-center border-r border-tv-border last:border-r-0"
            data-testid={testId ? `${testId}-slot-${index}` : undefined}
            role="columnheader"
          >
            <span className="text-tv-sm font-medium text-tv-text">
              {formatTime(slot)}
            </span>
          </div>
        ))}

        {/* Current time indicator */}
        {nowPosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-tv-error z-10"
            style={{ left: `${nowPosition}%` }}
            data-testid={testId ? `${testId}-now-indicator` : undefined}
            aria-label="Current time"
          />
        )}
      </div>
    </div>
  )
}
