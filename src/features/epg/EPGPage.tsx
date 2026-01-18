import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useMemo, useState } from 'react'
import type { Channel, Program } from '../../core/types/channel'
import type { Source } from '../../core/types/source'
import { useLiveChannels } from '../../core/hooks/useChannelQueries'
import { useEPGTimeRange } from '../../core/hooks/useEPGQueries'
import { useChannelStore } from '../../core/stores/channelStore'
import { Skeleton } from '../../core/components/Skeleton'
import { EPGGrid } from './EPGGrid'
import { EPGTimeline } from './EPGTimeline'
import { EPGChannelList } from './EPGChannelList'

/** Time slot duration in milliseconds (30 minutes) */
const TIME_SLOT_MS = 30 * 60 * 1000

/** Number of hours to display in the EPG grid */
const DISPLAY_HOURS = 3

/** Total display time in milliseconds */
const DISPLAY_TIME_MS = DISPLAY_HOURS * 60 * 60 * 1000

export interface EPGPageProps {
  /** The current IPTV source */
  source: Source | null
  /** Callback when a program is selected for playback */
  onProgramSelect?: (program: Program, channel: Channel) => void
  /** Callback when a channel is selected for playback */
  onChannelSelect?: (channel: Channel) => void
  /** Callback when back navigation is triggered */
  onBack?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * EPGPage - Electronic Program Guide page with full grid view.
 *
 * Features:
 * - Timeline showing time slots
 * - Channel list on the left
 * - Program grid showing programs for each channel
 * - Time navigation (scroll left/right through time)
 * - TV-optimized navigation with spatial navigation
 */
export function EPGPage({
  source,
  onProgramSelect,
  onChannelSelect,
  onBack,
  testId,
}: EPGPageProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'EPG_PAGE',
    isFocusBoundary: true,
  })

  // State for time window
  const [timeWindowStart, setTimeWindowStart] = useState(() => {
    // Start at the current hour
    const now = new Date()
    now.setMinutes(0, 0, 0)
    return now.getTime()
  })

  const timeWindowEnd = useMemo(
    () => timeWindowStart + DISPLAY_TIME_MS,
    [timeWindowStart]
  )

  // Fetch channels
  const {
    data: channels,
    isLoading: isLoadingChannels,
    error: channelsError,
  } = useLiveChannels({ source })

  // Fetch EPG data for the current time range
  const {
    data: epgData,
    isLoading: isLoadingEPG,
    error: epgError,
  } = useEPGTimeRange({
    source,
    startTime: timeWindowStart,
    endTime: timeWindowEnd,
  })

  // Channel store for state management
  const { setCurrentChannel } = useChannelStore()

  // Generate time slots for the timeline
  const timeSlots = useMemo(() => {
    const slots: number[] = []
    let current = timeWindowStart
    while (current < timeWindowEnd) {
      slots.push(current)
      current += TIME_SLOT_MS
    }
    return slots
  }, [timeWindowStart, timeWindowEnd])

  // Handle time navigation
  const handleNavigateTime = useCallback((direction: 'left' | 'right') => {
    const offset = direction === 'left' ? -TIME_SLOT_MS : TIME_SLOT_MS
    setTimeWindowStart((prev) => prev + offset)
  }, [])

  // Handle "Jump to Now"
  const handleJumpToNow = useCallback(() => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    setTimeWindowStart(now.getTime())
  }, [])

  // Handle channel selection
  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel)
      onChannelSelect?.(channel)
    },
    [setCurrentChannel, onChannelSelect]
  )

  // Handle program selection
  const handleProgramSelect = useCallback(
    (program: Program, channel: Channel) => {
      setCurrentChannel(channel)
      onProgramSelect?.(program, channel)
    },
    [setCurrentChannel, onProgramSelect]
  )

  const isLoading = isLoadingChannels || isLoadingEPG
  const error = channelsError || epgError

  // Loading state
  if (isLoading) {
    return (
      <div
        ref={ref}
        className="flex flex-col h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Timeline skeleton */}
        <div className="flex h-12 border-b border-tv-border">
          <div className="w-48 flex-shrink-0" />
          <div className="flex-1 flex items-center px-2 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width="100px"
                height="1.5rem"
                testId={testId ? `${testId}-timeline-skeleton-${i}` : undefined}
              />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Channel list skeleton */}
          <div className="w-48 flex-shrink-0 border-r border-tv-border p-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width="100%"
                height="3rem"
                className="mb-2"
                testId={testId ? `${testId}-channel-skeleton-${i}` : undefined}
              />
            ))}
          </div>

          {/* Program grid skeleton */}
          <div className="flex-1 p-2 overflow-hidden">
            {Array.from({ length: 10 }, (_, row) => (
              <div key={row} className="flex gap-2 mb-2">
                {Array.from({ length: 4 }, (_, col) => (
                  <Skeleton
                    key={col}
                    variant="rounded"
                    width="200px"
                    height="3rem"
                    testId={
                      testId
                        ? `${testId}-program-skeleton-${row}-${col}`
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          className="flex flex-col items-center justify-center h-screen bg-tv-bg"
          data-testid={testId}
        >
          <div className="text-center p-8 max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-16 h-16 mx-auto mb-4 text-tv-error"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              Failed to Load Program Guide
            </h2>
            <p className="text-tv-text-muted mb-6">
              {error.message || 'An error occurred while loading the EPG.'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-tv-accent text-white rounded-lg font-medium
                hover:bg-tv-accent-hover focus:outline-none focus:ring-2
                focus:ring-tv-accent focus:ring-offset-2 focus:ring-offset-tv-bg"
              data-testid={testId ? `${testId}-back-button` : undefined}
            >
              Go Back
            </button>
          </div>
        </div>
      </FocusContext.Provider>
    )
  }

  // Empty state
  if (!channels || channels.length === 0) {
    return (
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          className="flex flex-col items-center justify-center h-screen bg-tv-bg"
          data-testid={testId}
        >
          <div className="text-center p-8 max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-16 h-16 mx-auto mb-4 text-tv-text-muted"
              aria-hidden="true"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h4v2h-4v2h4v2H9V7h6v2z" />
            </svg>
            <h2 className="text-tv-2xl font-bold text-tv-text mb-2">
              No Program Guide Available
            </h2>
            <p className="text-tv-text-muted mb-6">
              {!source
                ? 'Please select an IPTV source first.'
                : 'No EPG data available for this source.'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-tv-accent text-white rounded-lg font-medium
                hover:bg-tv-accent-hover focus:outline-none focus:ring-2
                focus:ring-tv-accent focus:ring-offset-2 focus:ring-offset-tv-bg"
              data-testid={testId ? `${testId}-back-button` : undefined}
            >
              Go Back
            </button>
          </div>
        </div>
      </FocusContext.Provider>
    )
  }

  const programs = epgData?.programs ?? {}

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="flex flex-col h-screen bg-tv-bg"
        data-testid={testId}
      >
        {/* Header with navigation controls */}
        <header className="flex items-center justify-between px-4 py-2 bg-tv-surface border-b border-tv-border">
          <h1 className="text-tv-xl font-bold text-tv-text">Program Guide</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigateTime('left')}
              className="px-3 py-1 bg-tv-bg rounded text-tv-text hover:bg-tv-border
                focus:outline-none focus:ring-2 focus:ring-tv-accent"
              aria-label="Earlier programs"
              data-testid={testId ? `${testId}-nav-left` : undefined}
            >
              &larr; Earlier
            </button>
            <button
              onClick={handleJumpToNow}
              className="px-3 py-1 bg-tv-accent rounded text-white hover:bg-tv-accent-hover
                focus:outline-none focus:ring-2 focus:ring-tv-accent"
              data-testid={testId ? `${testId}-nav-now` : undefined}
            >
              Now
            </button>
            <button
              onClick={() => handleNavigateTime('right')}
              className="px-3 py-1 bg-tv-bg rounded text-tv-text hover:bg-tv-border
                focus:outline-none focus:ring-2 focus:ring-tv-accent"
              aria-label="Later programs"
              data-testid={testId ? `${testId}-nav-right` : undefined}
            >
              Later &rarr;
            </button>
          </div>
        </header>

        {/* Timeline */}
        <EPGTimeline
          timeSlots={timeSlots}
          timeWindowStart={timeWindowStart}
          testId={testId ? `${testId}-timeline` : undefined}
        />

        {/* Main grid area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Channel list */}
          <EPGChannelList
            channels={channels}
            onChannelSelect={handleChannelSelect}
            testId={testId ? `${testId}-channel-list` : undefined}
          />

          {/* Program grid */}
          <EPGGrid
            channels={channels}
            programs={programs}
            timeWindowStart={timeWindowStart}
            timeWindowEnd={timeWindowEnd}
            onProgramSelect={handleProgramSelect}
            testId={testId ? `${testId}-grid` : undefined}
          />
        </div>
      </div>
    </FocusContext.Provider>
  )
}
