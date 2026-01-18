import {
  useFocusable,
  FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Program } from '../../core/types/channel'

export interface ProgramDetailsProps {
  /** The program to display details for */
  program: Program
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Optional callback when watch is pressed (for currently airing programs) */
  onWatch?: (program: Program) => void
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats a timestamp for display as time
 */
function formatTime(time: string | number): string {
  const date = new Date(typeof time === 'number' ? time : time)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formats a timestamp for display as date
 */
function formatDate(time: string | number): string {
  const date = new Date(typeof time === 'number' ? time : time)
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Calculates the duration in minutes between two timestamps
 */
function getDurationMinutes(start: string | number, end: string | number): number {
  const startMs = typeof start === 'number' ? start : new Date(start).getTime()
  const endMs = typeof end === 'number' ? end : new Date(end).getTime()
  return Math.round((endMs - startMs) / 60000)
}

/**
 * Formats duration in minutes to human readable format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
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
 * Calculates progress percentage for a currently airing program
 */
function getProgress(program: Program): number {
  const now = Date.now()
  const start = typeof program.startTime === 'number'
    ? program.startTime
    : new Date(program.startTime).getTime()
  const end = typeof program.endTime === 'number'
    ? program.endTime
    : new Date(program.endTime).getTime()

  if (now < start) return 0
  if (now >= end) return 100

  return Math.round(((now - start) / (end - start)) * 100)
}

/**
 * ProgramDetails - A modal showing detailed EPG program information.
 *
 * Features:
 * - Program title, description, and metadata
 * - Time information with duration
 * - Progress bar for currently airing programs
 * - Watch button for currently airing programs
 * - Close on Back button or Escape
 * - Focus trapped within modal
 */
export function ProgramDetails({
  program,
  isOpen,
  onClose,
  onWatch,
  testId,
}: ProgramDetailsProps) {
  const [imageError, setImageError] = useState(false)

  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'PROGRAM_DETAILS_MODAL',
    isFocusBoundary: true,
    preferredChildFocusKey: onWatch && isCurrentlyAiring(program)
      ? 'PROGRAM_DETAILS_WATCH_BTN'
      : 'PROGRAM_DETAILS_CLOSE_BTN',
  })

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen) {
      focusSelf()
    }
  }, [isOpen, focusSelf])

  // Handle keyboard events for closing
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'XF86Back') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleWatch = useCallback(() => {
    if (onWatch) {
      onWatch(program)
    }
  }, [program, onWatch])

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const isAiring = useMemo(() => isCurrentlyAiring(program), [program])
  const progress = useMemo(() => isAiring ? getProgress(program) : 0, [program, isAiring])
  const duration = useMemo(
    () => getDurationMinutes(program.startTime, program.endTime),
    [program.startTime, program.endTime]
  )

  // Generate placeholder initials from program title
  const getInitials = (title: string): string => {
    return title
      .split(/[\s-]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (!isOpen) {
    return null
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center"
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-details-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
          data-testid={testId ? `${testId}-backdrop` : undefined}
        />

        {/* Modal content */}
        <div
          className="relative z-10 w-full max-w-2xl max-h-[90vh] mx-4 bg-tv-surface rounded-xl overflow-hidden shadow-2xl"
          onClick={handleContentClick}
        >
          {/* Header with image */}
          {program.image && !imageError ? (
            <div className="relative h-48 overflow-hidden">
              <img
                src={program.image}
                alt=""
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-tv-surface/50 to-transparent" />
            </div>
          ) : (
            <div className="h-24 bg-gradient-to-b from-tv-accent/20 to-tv-surface" />
          )}

          {/* Content */}
          <div className={`p-6 ${program.image && !imageError ? '-mt-16 relative' : ''}`}>
            <div className="flex gap-4">
              {/* Image thumbnail or placeholder */}
              <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden shadow-lg bg-tv-border">
                {program.image && !imageError ? (
                  <img
                    src={program.image}
                    alt={`${program.title} thumbnail`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-tv-lg font-bold text-tv-text-muted">
                      {getInitials(program.title)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2
                  id="program-details-title"
                  className="text-tv-xl font-bold text-tv-text mb-1"
                >
                  {program.title}
                </h2>

                {/* Live badge */}
                {isAiring && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tv-error rounded text-tv-xs text-white font-semibold">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE NOW
                    </span>
                  </div>
                )}

                {/* Time information */}
                <div className="text-tv-sm text-tv-text-muted mb-2">
                  <span>{formatDate(program.startTime)}</span>
                  <span className="mx-2">|</span>
                  <span>
                    {formatTime(program.startTime)} - {formatTime(program.endTime)}
                  </span>
                  <span className="mx-2">|</span>
                  <span>{formatDuration(duration)}</span>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-tv-sm text-tv-text-muted">
                  {program.category && (
                    <span className="px-2 py-0.5 bg-tv-border rounded">
                      {program.category}
                    </span>
                  )}
                  {program.rating && (
                    <span className="px-2 py-0.5 border border-tv-border rounded">
                      {program.rating}
                    </span>
                  )}
                  {program.seasonNumber !== undefined && program.episodeNumber !== undefined && (
                    <span>
                      S{program.seasonNumber} E{program.episodeNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar for live programs */}
            {isAiring && (
              <div className="mt-4">
                <div className="flex justify-between text-tv-xs text-tv-text-muted mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-tv-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tv-accent rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                    data-testid={testId ? `${testId}-progress` : undefined}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {program.description && (
              <p className="mt-4 text-tv-base text-tv-text-muted line-clamp-4">
                {program.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              {onWatch && isAiring && (
                <WatchButton
                  onWatch={handleWatch}
                  testId={testId ? `${testId}-watch-btn` : undefined}
                />
              )}
              <CloseButton
                onClose={onClose}
                testId={testId ? `${testId}-close-btn` : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}

interface WatchButtonProps {
  onWatch: () => void
  testId?: string
}

function WatchButton({ onWatch, testId }: WatchButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'PROGRAM_DETAILS_WATCH_BTN',
    onEnterPress: onWatch,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'px-8',
    'py-3',
    'rounded-lg',
    'font-semibold',
    'text-tv-lg',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-accent',
        'text-white',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-accent/80', 'text-white', 'hover:bg-tv-accent']

  return (
    <button
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      onClick={onWatch}
      tabIndex={0}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      Watch Now
    </button>
  )
}

interface CloseButtonProps {
  onClose: () => void
  testId?: string
}

function CloseButton({ onClose, testId }: CloseButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'PROGRAM_DETAILS_CLOSE_BTN',
    onEnterPress: onClose,
  })

  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'px-8',
    'py-3',
    'rounded-lg',
    'font-semibold',
    'text-tv-lg',
    'transition-all',
    'duration-150',
    'outline-none',
  ]

  const stateClasses = focused
    ? [
        'bg-tv-border',
        'text-tv-text',
        'shadow-[0_0_0_4px_var(--color-tv-accent),0_0_30px_var(--color-tv-accent-glow)]',
      ]
    : ['bg-tv-border/50', 'text-tv-text-muted', 'hover:bg-tv-border']

  return (
    <button
      ref={ref}
      className={[...baseClasses, ...stateClasses].join(' ')}
      data-testid={testId}
      data-focused={focused}
      onClick={onClose}
      tabIndex={0}
    >
      Close
    </button>
  )
}
