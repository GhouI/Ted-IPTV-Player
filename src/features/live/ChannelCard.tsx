import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState, useCallback } from 'react'
import type { Channel } from '../../core/types/channel'

export interface ChannelCardProps {
  /** The channel to display */
  channel: Channel
  /** Currently playing program title (optional) */
  nowPlaying?: string
  /** Callback when the channel is selected */
  onSelect?: () => void
  /** Callback when the channel receives focus */
  onFocus?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * ChannelCard - A TV-optimized card displaying channel info.
 *
 * Features:
 * - Channel logo with fallback
 * - Channel name and number
 * - Now playing info (if provided)
 * - TV-optimized focus states
 * - Spatial navigation support
 */
export function ChannelCard({
  channel,
  nowPlaying,
  onSelect,
  onFocus,
  testId,
}: ChannelCardProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focused } = useFocusable({
    focusKey: `CHANNEL_${channel.id}`,
    onEnterPress: onSelect,
    onFocus,
  })

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    onSelect?.()
  }, [onSelect])

  const baseClasses = [
    'relative',
    'flex',
    'flex-col',
    'overflow-hidden',
    'rounded-lg',
    'bg-tv-surface',
    'border-2',
    'transition-all',
    'duration-150',
    'outline-none',
    'cursor-pointer',
  ]

  const stateClasses = focused
    ? [
        'border-tv-accent',
        'scale-105',
        'z-10',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow),0_4px_20px_rgba(0,0,0,0.5)]',
      ]
    : ['border-transparent', 'hover:border-tv-border']

  const combinedClasses = [...baseClasses, ...stateClasses].join(' ')

  // Generate placeholder initials from channel name
  const getInitials = (name: string): string => {
    return name
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      role="button"
      tabIndex={0}
      aria-label={`${channel.name}${channel.number ? `, channel ${channel.number}` : ''}${nowPlaying ? `, now playing: ${nowPlaying}` : ''}`}
      onClick={handleClick}
    >
      {/* Channel logo area */}
      <div className="relative aspect-video bg-tv-bg flex items-center justify-center overflow-hidden">
        {channel.logo && !imageError ? (
          <img
            src={channel.logo}
            alt={`${channel.name} logo`}
            className="w-full h-full object-contain p-2"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-tv-border">
            <span className="text-tv-2xl font-bold text-tv-text-muted">
              {getInitials(channel.name)}
            </span>
          </div>
        )}

        {/* Channel number badge */}
        {channel.number !== undefined && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-tv-sm font-medium text-white">
            {channel.number}
          </div>
        )}

        {/* Availability indicator */}
        {channel.isAvailable === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-tv-sm text-tv-text-muted">Unavailable</span>
          </div>
        )}
      </div>

      {/* Channel info */}
      <div className="p-3">
        <h3 className="text-tv-base font-medium text-tv-text truncate">
          {channel.name}
        </h3>
        {nowPlaying && (
          <p className="text-tv-sm text-tv-text-muted truncate mt-1">
            {nowPlaying}
          </p>
        )}
      </div>
    </div>
  )
}
