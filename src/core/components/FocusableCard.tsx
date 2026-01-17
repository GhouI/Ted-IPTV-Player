import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ReactNode } from 'react'

export interface FocusableCardProps {
  /** Unique key for spatial navigation focus management */
  focusKey?: string
  /** Content to render inside the card */
  children: ReactNode
  /** Callback when the card is selected (Enter/OK pressed) */
  onSelect?: () => void
  /** Callback when the card receives focus */
  onFocus?: () => void
  /** Callback when the card loses focus */
  onBlur?: () => void
  /** Whether the card is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Card aspect ratio preset */
  aspectRatio?: 'square' | 'video' | 'poster'
  /** Whether this card is currently selected/active */
  selected?: boolean
  /** Test ID for testing purposes */
  testId?: string
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  poster: 'aspect-[2/3]',
} as const

/**
 * FocusableCard - A TV-optimized card component for grid items.
 *
 * Features:
 * - Spatial navigation support via Norigin
 * - TV-optimized focus states with glow and scale effects
 * - Support for different aspect ratios (poster, video, square)
 * - Disabled state handling
 * - Selection state for highlighting active items
 */
export function FocusableCard({
  focusKey,
  children,
  onSelect,
  onFocus,
  onBlur,
  disabled = false,
  className = '',
  aspectRatio,
  selected = false,
  testId,
}: FocusableCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: disabled ? undefined : onSelect,
    onFocus: disabled ? undefined : onFocus,
    onBlur,
    focusable: !disabled,
  })

  const baseClasses = [
    'relative',
    'overflow-hidden',
    'rounded-lg',
    'bg-tv-surface',
    'border-2',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = disabled
    ? ['opacity-50', 'cursor-not-allowed', 'border-transparent']
    : focused
      ? [
          'border-tv-accent',
          'scale-105',
          'z-10',
          'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow),0_4px_20px_rgba(0,0,0,0.5)]',
        ]
      : selected
        ? ['border-tv-accent', 'border-opacity-50']
        : ['border-transparent', 'hover:border-tv-border']

  const aspectClass = aspectRatio ? aspectRatioClasses[aspectRatio] : ''

  const combinedClasses = [...baseClasses, ...stateClasses, aspectClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      data-selected={selected}
      data-disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}
