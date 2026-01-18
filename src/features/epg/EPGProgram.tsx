import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useMemo } from 'react'
import type { Program } from '../../core/types/channel'

export interface EPGProgramProps {
  /** The program to display (null for empty/gap cells) */
  program: Program | null
  /** Left position as percentage */
  left: number
  /** Width as percentage */
  width: number
  /** Channel ID for focus key uniqueness */
  channelId: string
  /** Callback when the program is selected */
  onSelect?: (program: Program) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats a timestamp for display
 */
function formatTime(time: string | number): string {
  const date = new Date(typeof time === 'number' ? time : time)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Checks if a program is currently airing
 */
function isCurrentlyAiring(program: Program): boolean {
  const now = Date.now()
  const start = typeof program.startTime === 'number'
    ? program.startTime
    : new Date(program.startTime).getTime()
  const end = typeof program.endTime === 'number'
    ? program.endTime
    : new Date(program.endTime).getTime()
  return now >= start && now < end
}

/**
 * EPGProgram - A single program cell in the EPG grid.
 *
 * Features:
 * - Displays program title and time
 * - Shows "No Program" for gaps
 * - Highlights currently airing programs
 * - Focusable for TV navigation
 */
export function EPGProgram({
  program,
  left,
  width,
  channelId,
  onSelect,
  testId,
}: EPGProgramProps) {
  const handleSelect = useCallback(() => {
    if (program && onSelect) {
      onSelect(program)
    }
  }, [program, onSelect])

  const { ref, focused } = useFocusable({
    focusKey: `EPG_PROGRAM_${channelId}_${program?.id ?? 'empty'}_${left}`,
    onEnterPress: handleSelect,
    focusable: program !== null,
  })

  const isAiring = useMemo(() => {
    return program ? isCurrentlyAiring(program) : false
  }, [program])

  // Empty cell (no program data)
  if (!program) {
    return (
      <div
        ref={ref}
        className="absolute h-full bg-tv-bg border-r border-tv-border flex items-center px-2"
        style={{ left: `${left}%`, width: `${width}%` }}
        data-testid={testId}
        role="gridcell"
      >
        <span className="text-tv-xs text-tv-text-muted italic truncate">
          No Program Info
        </span>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`
        absolute h-full border-r border-tv-border flex flex-col justify-center px-2 cursor-pointer
        transition-all duration-150 overflow-hidden
        ${
          focused
            ? 'bg-tv-accent text-white z-10 shadow-lg'
            : isAiring
              ? 'bg-tv-accent/20 text-tv-text'
              : 'bg-tv-surface text-tv-text hover:bg-tv-bg'
        }
      `}
      style={{ left: `${left}%`, width: `${width}%` }}
      data-testid={testId}
      data-focused={focused}
      data-airing={isAiring}
      role="gridcell"
      tabIndex={0}
      aria-label={`${program.title}, ${formatTime(program.startTime)} to ${formatTime(program.endTime)}`}
    >
      {/* Program title */}
      <p
        className={`text-tv-sm font-medium truncate ${focused ? 'text-white' : 'text-tv-text'}`}
      >
        {isAiring && !focused && (
          <span className="inline-block w-2 h-2 rounded-full bg-tv-error mr-1 animate-pulse" />
        )}
        {program.title}
      </p>

      {/* Program time - only show if there's enough width */}
      {width > 10 && (
        <p
          className={`text-tv-xs truncate ${focused ? 'text-white/80' : 'text-tv-text-muted'}`}
        >
          {formatTime(program.startTime)} - {formatTime(program.endTime)}
        </p>
      )}
    </div>
  )
}
