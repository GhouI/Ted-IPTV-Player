import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useCallback } from 'react'
import type { Channel } from '../../core/types/channel'

export interface EPGChannelListProps {
  /** Array of channels to display */
  channels: Channel[]
  /** Callback when a channel is selected */
  onChannelSelect?: (channel: Channel) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * EPGChannelList - Displays the channel list sidebar in the EPG.
 *
 * Features:
 * - Vertical list of channels with logos and names
 * - Focusable items for TV navigation
 * - Synchronized scrolling with the program grid
 */
export function EPGChannelList({
  channels,
  onChannelSelect,
  testId,
}: EPGChannelListProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'EPG_CHANNEL_LIST',
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="w-48 flex-shrink-0 border-r border-tv-border overflow-y-auto bg-tv-surface"
        data-testid={testId}
        role="list"
        aria-label="Channels"
      >
        {channels.map((channel, index) => (
          <EPGChannelItem
            key={channel.id}
            channel={channel}
            onSelect={onChannelSelect}
            testId={testId ? `${testId}-item-${index}` : undefined}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

interface EPGChannelItemProps {
  channel: Channel
  onSelect?: (channel: Channel) => void
  testId?: string
}

function EPGChannelItem({ channel, onSelect, testId }: EPGChannelItemProps) {
  const handleSelect = useCallback(() => {
    onSelect?.(channel)
  }, [channel, onSelect])

  const { ref, focused } = useFocusable({
    focusKey: `EPG_CHANNEL_${channel.id}`,
    onEnterPress: handleSelect,
  })

  return (
    <div
      ref={ref}
      className={`
        h-12 flex items-center gap-2 px-3 border-b border-tv-border cursor-pointer
        transition-colors duration-150
        ${focused ? 'bg-tv-accent text-white' : 'hover:bg-tv-bg'}
      `}
      data-testid={testId}
      data-focused={focused}
      role="listitem"
      tabIndex={0}
    >
      {/* Channel logo */}
      {channel.logo ? (
        <img
          src={channel.logo}
          alt=""
          className="w-8 h-8 object-contain rounded flex-shrink-0"
          onError={(e) => {
            // Hide broken images
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded bg-tv-border flex items-center justify-center flex-shrink-0">
          <span className="text-tv-xs text-tv-text-muted">
            {channel.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Channel name */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-tv-sm font-medium truncate ${focused ? 'text-white' : 'text-tv-text'}`}
        >
          {channel.number !== undefined && (
            <span className="text-tv-text-muted mr-1">{channel.number}.</span>
          )}
          {channel.name}
        </p>
      </div>
    </div>
  )
}
