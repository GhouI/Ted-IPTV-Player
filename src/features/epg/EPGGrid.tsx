import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useMemo } from 'react'
import type { Channel, Program } from '../../core/types/channel'
import { EPGProgram } from './EPGProgram'

export interface EPGGridProps {
  /** Array of channels */
  channels: Channel[]
  /** Programs organized by channel ID */
  programs: Record<string, Program[]>
  /** Start time of the visible window (Unix timestamp in ms) */
  timeWindowStart: number
  /** End time of the visible window (Unix timestamp in ms) */
  timeWindowEnd: number
  /** Callback when a program is selected */
  onProgramSelect?: (program: Program, channel: Channel) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Converts a time value to a timestamp
 */
function toTimestamp(time: string | number): number {
  if (typeof time === 'number') {
    return time
  }
  return new Date(time).getTime()
}

/**
 * EPGGrid - The main program grid showing programs for all channels.
 *
 * Features:
 * - Shows programs as horizontal bars sized proportionally to duration
 * - Supports programs that span partial time windows
 * - Focusable program cells for TV navigation
 * - Fills gaps with "No Program" placeholders
 */
export function EPGGrid({
  channels,
  programs,
  timeWindowStart,
  timeWindowEnd,
  onProgramSelect,
  testId,
}: EPGGridProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'EPG_GRID',
  })

  const totalDuration = timeWindowEnd - timeWindowStart

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        data-testid={testId}
        role="grid"
        aria-label="Program guide"
      >
        {channels.map((channel, rowIndex) => (
          <EPGRow
            key={channel.id}
            channel={channel}
            programs={programs[channel.epgChannelId ?? channel.id] || []}
            timeWindowStart={timeWindowStart}
            timeWindowEnd={timeWindowEnd}
            totalDuration={totalDuration}
            onProgramSelect={onProgramSelect}
            testId={testId ? `${testId}-row-${rowIndex}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

interface EPGRowProps {
  channel: Channel
  programs: Program[]
  timeWindowStart: number
  timeWindowEnd: number
  totalDuration: number
  onProgramSelect?: (program: Program, channel: Channel) => void
  testId?: string
}

function EPGRow({
  channel,
  programs,
  timeWindowStart,
  timeWindowEnd,
  totalDuration,
  onProgramSelect,
  testId,
}: EPGRowProps) {
  // Filter and sort programs that overlap with the time window
  const visiblePrograms = useMemo(() => {
    return programs
      .filter((program) => {
        const start = toTimestamp(program.startTime)
        const end = toTimestamp(program.endTime)
        // Program overlaps if it starts before window ends and ends after window starts
        return start < timeWindowEnd && end > timeWindowStart
      })
      .sort((a, b) => toTimestamp(a.startTime) - toTimestamp(b.startTime))
  }, [programs, timeWindowStart, timeWindowEnd])

  // Calculate program positions and widths, filling gaps
  const programCells = useMemo(() => {
    const cells: Array<{
      program: Program | null
      left: number
      width: number
      id: string
    }> = []

    let currentTime = timeWindowStart

    for (const program of visiblePrograms) {
      const programStart = Math.max(toTimestamp(program.startTime), timeWindowStart)
      const programEnd = Math.min(toTimestamp(program.endTime), timeWindowEnd)

      // Fill gap before this program
      if (programStart > currentTime) {
        const gapStart = currentTime
        const gapEnd = programStart
        const gapLeft = ((gapStart - timeWindowStart) / totalDuration) * 100
        const gapWidth = ((gapEnd - gapStart) / totalDuration) * 100

        cells.push({
          program: null,
          left: gapLeft,
          width: gapWidth,
          id: `gap-${gapStart}`,
        })
      }

      // Add the program
      const left = ((programStart - timeWindowStart) / totalDuration) * 100
      const width = ((programEnd - programStart) / totalDuration) * 100

      cells.push({
        program,
        left,
        width,
        id: program.id,
      })

      currentTime = programEnd
    }

    // Fill gap at the end if needed
    if (currentTime < timeWindowEnd) {
      const gapLeft = ((currentTime - timeWindowStart) / totalDuration) * 100
      const gapWidth = ((timeWindowEnd - currentTime) / totalDuration) * 100

      cells.push({
        program: null,
        left: gapLeft,
        width: gapWidth,
        id: `gap-${currentTime}`,
      })
    }

    // If no programs at all, fill the entire row
    if (cells.length === 0) {
      cells.push({
        program: null,
        left: 0,
        width: 100,
        id: 'empty',
      })
    }

    return cells
  }, [visiblePrograms, timeWindowStart, timeWindowEnd, totalDuration])

  const handleProgramSelect = useCallback(
    (program: Program) => {
      onProgramSelect?.(program, channel)
    },
    [channel, onProgramSelect]
  )

  return (
    <div
      className="h-12 flex relative border-b border-tv-border"
      data-testid={testId}
      role="row"
    >
      {programCells.map((cell, index) => (
        <EPGProgram
          key={cell.id}
          program={cell.program}
          left={cell.left}
          width={cell.width}
          channelId={channel.id}
          onSelect={cell.program ? handleProgramSelect : undefined}
          testId={testId ? `${testId}-cell-${index}` : undefined}
        />
      ))}
    </div>
  )
}
