import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ReactNode } from 'react'

export interface MenuCardProps {
  /** Unique key for spatial navigation focus management */
  focusKey?: string
  /** Title of the menu item */
  title: string
  /** Icon to display */
  icon: ReactNode
  /** Optional description */
  description?: string
  /** Callback when the card is selected (Enter/OK pressed) */
  onSelect?: () => void
  /** Callback when the card receives focus */
  onFocus?: () => void
  /** Whether the card is disabled */
  disabled?: boolean
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * MenuCard - A TV-optimized card component for home screen navigation.
 *
 * Features:
 * - Large touch target for TV remote navigation
 * - Prominent icon display
 * - Title and optional description
 * - TV-optimized focus states with glow effects
 * - Spatial navigation support
 */
export function MenuCard({
  focusKey,
  title,
  icon,
  description,
  onSelect,
  onFocus,
  disabled = false,
  testId,
}: MenuCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: disabled ? undefined : onSelect,
    onFocus: disabled ? undefined : onFocus,
    focusable: !disabled,
  })

  const baseClasses = [
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'p-8',
    'rounded-xl',
    'bg-tv-surface',
    'border-2',
    'transition-all',
    'duration-150',
    'outline-none',
    'min-w-[200px]',
    'min-h-[180px]',
  ]

  const stateClasses = disabled
    ? ['opacity-50', 'cursor-not-allowed', 'border-transparent']
    : focused
      ? [
          'border-tv-accent',
          'scale-110',
          'z-10',
          'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_40px_var(--color-tv-accent-glow),0_8px_30px_rgba(0,0,0,0.6)]',
        ]
      : ['border-transparent', 'hover:border-tv-border']

  const combinedClasses = [...baseClasses, ...stateClasses].join(' ')

  const iconClasses = [
    'text-5xl',
    'mb-4',
    'transition-transform',
    'duration-150',
    focused && !disabled ? 'scale-110' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const titleClasses = [
    'text-tv-xl',
    'font-semibold',
    'text-center',
    'transition-colors',
    'duration-150',
    focused && !disabled ? 'text-tv-accent' : 'text-tv-text',
  ].join(' ')

  const descriptionClasses = [
    'text-tv-sm',
    'text-tv-text-muted',
    'text-center',
    'mt-2',
  ].join(' ')

  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect()
    }
  }

  return (
    <div
      ref={ref}
      className={combinedClasses}
      data-testid={testId}
      data-focused={focused}
      data-disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={title}
      onClick={handleClick}
    >
      <div className={iconClasses}>{icon}</div>
      <span className={titleClasses}>{title}</span>
      {description && <span className={descriptionClasses}>{description}</span>}
    </div>
  )
}
