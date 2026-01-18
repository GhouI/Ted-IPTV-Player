import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { Channel } from '../../core/types/channel'
import { ChannelCard } from './ChannelCard'

export interface ChannelGridProps {
  /** Array of channels to display */
  channels: Channel[]
  /** Callback when a channel is selected for playback */
  onChannelSelect?: (channel: Channel) => void
  /** Number of columns in the grid */
  columns?: 3 | 4 | 5 | 6
  /** Test ID for testing purposes */
  testId?: string
}

const columnClasses = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
} as const

/**
 * ChannelGrid - Grid layout of channel cards with spatial navigation.
 *
 * Features:
 * - Responsive grid layout with configurable columns
 * - Spatial navigation support for TV remote
 * - Focus context for contained navigation
 * - Smooth scrolling to focused items
 */
export function ChannelGrid({
  channels,
  onChannelSelect,
  columns = 4,
  testId,
}: ChannelGridProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'CHANNEL_GRID',
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
    trackChildren: true,
    saveLastFocusedChild: true,
  })

  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      onChannelSelect?.(channel)
    },
    [onChannelSelect]
  )

  if (channels.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-testid={testId}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-12 h-12 text-tv-text-muted mb-4"
          aria-hidden="true"
        >
          <path d="M4 6h16v12H4V6zm0-2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4z" />
        </svg>
        <p className="text-tv-text-muted text-tv-lg">
          No channels in this category
        </p>
      </div>
    )
  }

  const gridClasses = ['grid', columnClasses[columns], 'gap-4']

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className={gridClasses.join(' ')}
        data-testid={testId}
        role="grid"
        aria-label="Channel grid"
      >
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onSelect={() => handleChannelSelect(channel)}
            testId={testId ? `${testId}-channel-${channel.id}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}
