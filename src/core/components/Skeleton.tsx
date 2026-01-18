import type { CSSProperties } from 'react'

export interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number
  /** Height of the skeleton (CSS value) */
  height?: string | number
  /** Shape variant */
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
  /** Whether to animate the skeleton */
  animation?: 'pulse' | 'wave' | 'none'
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
  /** Number of skeleton items to render (for lists) */
  count?: number
  /** Gap between items when count > 1 */
  gap?: string | number
}

const variantClasses = {
  text: 'rounded',
  rectangular: '',
  circular: 'rounded-full',
  rounded: 'rounded-lg',
} as const

const animationClasses = {
  pulse: 'animate-pulse',
  wave: 'skeleton-wave',
  none: '',
} as const

/**
 * Skeleton - Loading placeholder component for TV UI.
 *
 * Features:
 * - Multiple shape variants (text, rectangular, circular, rounded)
 * - Animation options (pulse, wave, none)
 * - Configurable dimensions
 * - Support for rendering multiple skeletons
 * - TV-optimized styling matching the dark theme
 */
export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className = '',
  testId,
  count = 1,
  gap = '0.5rem',
}: SkeletonProps) {
  const style: CSSProperties = {}

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }

  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height
  } else if (variant === 'text') {
    // Default height for text variant
    style.height = '1em'
  }

  const baseClasses = ['bg-tv-border', variantClasses[variant], animationClasses[animation], className]
    .filter(Boolean)
    .join(' ')

  if (count === 1) {
    return <div className={baseClasses} style={style} data-testid={testId} aria-hidden="true" />
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  }

  return (
    <div style={containerStyle} data-testid={testId} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={baseClasses} style={style} data-testid={testId ? `${testId}-${index}` : undefined} />
      ))}
    </div>
  )
}

export interface SkeletonCardProps {
  /** Aspect ratio preset */
  aspectRatio?: 'square' | 'video' | 'poster'
  /** Whether to show text lines below the card */
  showText?: boolean
  /** Number of text lines to show */
  textLines?: number
  /** Additional CSS classes for the container */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

const aspectRatioStyles = {
  square: { paddingBottom: '100%' },
  video: { paddingBottom: '56.25%' }, // 16:9
  poster: { paddingBottom: '150%' }, // 2:3
} as const

/**
 * SkeletonCard - Card-shaped loading placeholder for grid items.
 *
 * Features:
 * - Predefined aspect ratios matching FocusableCard
 * - Optional text line placeholders
 * - TV-optimized styling
 */
export function SkeletonCard({
  aspectRatio = 'video',
  showText = true,
  textLines = 2,
  className = '',
  testId,
}: SkeletonCardProps) {
  return (
    <div className={`flex flex-col ${className}`} data-testid={testId} aria-hidden="true">
      <div className="relative w-full overflow-hidden rounded-lg bg-tv-border">
        <div style={aspectRatioStyles[aspectRatio]} className="animate-pulse bg-tv-border" />
      </div>
      {showText && (
        <div className="mt-2 space-y-2">
          {Array.from({ length: textLines }, (_, index) => (
            <Skeleton
              key={index}
              variant="text"
              width={index === 0 ? '100%' : '60%'}
              height="0.875rem"
              testId={testId ? `${testId}-text-${index}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export interface SkeletonListProps {
  /** Number of list items */
  count?: number
  /** Height of each list item */
  itemHeight?: string | number
  /** Gap between items */
  gap?: string | number
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * SkeletonList - List of loading placeholders.
 *
 * Features:
 * - Configurable item count and height
 * - TV-optimized spacing
 */
export function SkeletonList({
  count = 5,
  itemHeight = '3rem',
  gap = '0.5rem',
  className = '',
  testId,
}: SkeletonListProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }}
      data-testid={testId}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          width="100%"
          height={itemHeight}
          testId={testId ? `${testId}-item-${index}` : undefined}
        />
      ))}
    </div>
  )
}
