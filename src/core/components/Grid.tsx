import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { ReactNode } from 'react'

export interface GridProps {
  /** Unique key for spatial navigation focus management */
  focusKey?: string
  /** Grid items to render */
  children: ReactNode
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4 | 5 | 6
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Whether this grid is a focus boundary */
  isFocusBoundary?: boolean
  /** Callback when the grid receives focus */
  onFocus?: () => void
  /** Callback when the grid loses focus */
  onBlur?: () => void
  /** Test ID for testing purposes */
  testId?: string
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
} as const

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
} as const

/**
 * Grid - A TV-optimized grid layout component with spatial navigation.
 *
 * Features:
 * - Spatial navigation support via Norigin
 * - Configurable columns (2-6)
 * - Configurable gap sizes
 * - Optional focus boundary for contained navigation
 * - Works seamlessly with FocusableCard components
 */
export function Grid({
  focusKey,
  children,
  columns = 4,
  gap = 'md',
  className = '',
  isFocusBoundary = false,
  onFocus,
  onBlur,
  testId,
}: GridProps) {
  const { ref, focusKey: currentFocusKey } = useFocusable({
    focusKey,
    isFocusBoundary,
    onFocus,
    onBlur,
    trackChildren: true,
  })

  const baseClasses = ['grid']
  const colClass = columnClasses[columns]
  const gapClass = gapClasses[gap]

  const combinedClasses = [...baseClasses, colClass, gapClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <FocusContext.Provider value={currentFocusKey}>
      <div ref={ref} className={combinedClasses} data-testid={testId} role="grid">
        {children}
      </div>
    </FocusContext.Provider>
  )
}
