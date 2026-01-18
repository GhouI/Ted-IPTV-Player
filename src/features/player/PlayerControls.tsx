import { useCallback, useRef, useState } from 'react'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import { useVideoPlayerControls } from './useVideoPlayerControls'

export interface PlayerControlsProps {
  /** Callback to trigger play action on the video element */
  onPlay?: () => void
  /** Callback to trigger pause action on the video element */
  onPause?: () => void
  /** Callback to seek to a specific time in seconds */
  onSeek?: (time: number) => void
  /** Callback to change volume (0-1) */
  onVolumeChange?: (volume: number) => void
  /** Callback to toggle mute state */
  onToggleMute?: () => void
  /** Whether the controls are visible */
  visible?: boolean
  /** Additional CSS classes */
  className?: string
  /** Test ID for testing purposes */
  testId?: string
}

/**
 * Formats time in seconds to MM:SS or HH:MM:SS format
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * PlayerControls - Video player controls component with play/pause, seek bar, and volume.
 *
 * Features:
 * - Play/pause button with appropriate icons
 * - Seek bar with progress and buffer visualization
 * - Volume control with mute toggle
 * - Time display (current / duration)
 * - TV remote navigation support via spatial navigation
 * - Live stream indicator (hides seek bar for live content)
 */
export function PlayerControls({
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  visible = true,
  className = '',
  testId,
}: PlayerControlsProps) {
  const {
    currentTime,
    duration,
    volume,
    isMuted,
    isLive,
    isSeekable,
    isPlaying,
    isBuffering,
    progressPercent,
    bufferPercent,
    volumePercent,
  } = useVideoPlayerControls()

  const { ref: containerRef, focusKey } = useFocusable({
    focusKey: 'player-controls',
    trackChildren: true,
    saveLastFocusedChild: true,
  })

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause?.()
    } else {
      onPlay?.()
    }
  }, [isPlaying, onPlay, onPause])

  // Container classes
  const containerClasses = [
    'absolute',
    'bottom-0',
    'left-0',
    'right-0',
    'bg-gradient-to-t',
    'from-black/90',
    'via-black/60',
    'to-transparent',
    'px-6',
    'pt-16',
    'pb-6',
    'transition-opacity',
    'duration-300',
    visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
    className,
  ].filter(Boolean).join(' ')

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={containerRef}
        className={containerClasses}
        data-testid={testId}
        data-visible={visible}
      >
        {/* Progress/Seek Bar */}
        {!isLive && isSeekable && (
          <SeekBar
            currentTime={currentTime}
            duration={duration}
            progressPercent={progressPercent}
            bufferPercent={bufferPercent}
            onSeek={onSeek}
            testId={testId ? `${testId}-seek` : undefined}
          />
        )}

        {/* Controls Row */}
        <div className="flex items-center gap-4 mt-4">
          {/* Play/Pause Button */}
          <PlayPauseButton
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            onClick={handlePlayPause}
            testId={testId ? `${testId}-playpause` : undefined}
          />

          {/* Time Display */}
          <TimeDisplay
            currentTime={currentTime}
            duration={duration}
            isLive={isLive}
            testId={testId ? `${testId}-time` : undefined}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Volume Controls */}
          <VolumeControl
            volume={volume}
            volumePercent={volumePercent}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
            testId={testId ? `${testId}-volume` : undefined}
          />
        </div>
      </div>
    </FocusContext.Provider>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

interface PlayPauseButtonProps {
  isPlaying: boolean
  isBuffering: boolean
  onClick?: () => void
  testId?: string
}

function PlayPauseButton({ isPlaying, isBuffering, onClick, testId }: PlayPauseButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey: 'play-pause-btn',
    onEnterPress: onClick,
  })

  const buttonClasses = [
    'w-14',
    'h-14',
    'flex',
    'items-center',
    'justify-center',
    'rounded-full',
    'bg-white/20',
    'backdrop-blur-sm',
    'transition-all',
    'duration-150',
    focused ? 'bg-tv-accent scale-110 shadow-lg' : 'hover:bg-white/30',
  ].join(' ')

  return (
    <button
      ref={ref}
      className={buttonClasses}
      onClick={onClick}
      data-testid={testId}
      data-focused={focused}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isBuffering ? (
        <LoadingSpinner />
      ) : isPlaying ? (
        <PauseIcon />
      ) : (
        <PlayIcon />
      )}
    </button>
  )
}

interface SeekBarProps {
  currentTime: number
  duration: number
  progressPercent: number
  bufferPercent: number
  onSeek?: (time: number) => void
  testId?: string
}

function SeekBar({
  currentTime,
  duration,
  progressPercent,
  bufferPercent,
  onSeek,
  testId,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoverPercent, setHoverPercent] = useState<number | null>(null)

  const { ref, focused } = useFocusable({
    focusKey: 'seek-bar',
    onArrowPress: (direction) => {
      if (!onSeek || duration <= 0) return false

      const seekStep = 10 // seconds
      if (direction === 'left') {
        const newTime = Math.max(0, currentTime - seekStep)
        onSeek(newTime)
        return true
      } else if (direction === 'right') {
        const newTime = Math.min(duration, currentTime + seekStep)
        onSeek(newTime)
        return true
      }
      return false
    },
  })

  // Handle click on track to seek
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !onSeek || duration <= 0) return

    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = percent * duration
    onSeek(time)
  }, [duration, onSeek])

  // Handle mouse move for hover preview
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return

    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setHoverPercent(percent)
  }, [duration])

  const handleMouseLeave = useCallback(() => {
    setHoverPercent(null)
  }, [])

  const containerClasses = [
    'relative',
    'w-full',
    'h-8',
    'flex',
    'items-center',
    'cursor-pointer',
    'group',
  ].join(' ')

  const trackClasses = [
    'relative',
    'w-full',
    'h-1',
    'bg-white/30',
    'rounded-full',
    'overflow-hidden',
    'transition-all',
    'duration-150',
    focused ? 'h-2' : 'group-hover:h-2',
  ].join(' ')

  return (
    <div
      ref={ref}
      className={containerClasses}
      data-testid={testId}
      data-focused={focused}
    >
      <div
        ref={trackRef}
        className={trackClasses}
        onClick={handleTrackClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Buffer Bar */}
        <div
          className="absolute h-full bg-white/40 rounded-full"
          style={{ width: `${bufferPercent}%` }}
          data-testid={testId ? `${testId}-buffer` : undefined}
        />

        {/* Progress Bar */}
        <div
          className="absolute h-full bg-tv-accent rounded-full"
          style={{ width: `${progressPercent}%` }}
          data-testid={testId ? `${testId}-progress` : undefined}
        />

        {/* Seek Handle */}
        <div
          className={[
            'absolute',
            'top-1/2',
            '-translate-y-1/2',
            '-translate-x-1/2',
            'w-4',
            'h-4',
            'bg-tv-accent',
            'rounded-full',
            'shadow-lg',
            'transition-all',
            'duration-150',
            focused ? 'scale-125' : 'scale-0 group-hover:scale-100',
          ].join(' ')}
          style={{ left: `${progressPercent}%` }}
          data-testid={testId ? `${testId}-handle` : undefined}
        />
      </div>

      {/* Hover time preview */}
      {hoverPercent !== null && duration > 0 && (
        <div
          className="absolute -top-8 px-2 py-1 bg-black/80 rounded text-xs text-white"
          style={{ left: `${hoverPercent}%`, transform: 'translateX(-50%)' }}
        >
          {formatTime((hoverPercent / 100) * duration)}
        </div>
      )}
    </div>
  )
}

interface TimeDisplayProps {
  currentTime: number
  duration: number
  isLive: boolean
  testId?: string
}

function TimeDisplay({ currentTime, duration, isLive, testId }: TimeDisplayProps) {
  if (isLive) {
    return (
      <div
        className="flex items-center gap-2 text-white"
        data-testid={testId}
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">LIVE</span>
      </div>
    )
  }

  return (
    <div
      className="text-sm text-white/90 font-mono"
      data-testid={testId}
    >
      <span data-testid={testId ? `${testId}-current` : undefined}>
        {formatTime(currentTime)}
      </span>
      <span className="mx-1 text-white/50">/</span>
      <span data-testid={testId ? `${testId}-duration` : undefined}>
        {formatTime(duration)}
      </span>
    </div>
  )
}

interface VolumeControlProps {
  volume: number
  volumePercent: number
  isMuted: boolean
  onVolumeChange?: (volume: number) => void
  onToggleMute?: () => void
  testId?: string
}

function VolumeControl({
  volume,
  volumePercent,
  isMuted,
  onVolumeChange,
  onToggleMute,
  testId,
}: VolumeControlProps) {
  const [showSlider, setShowSlider] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const { ref: buttonRef, focused: buttonFocused } = useFocusable({
    focusKey: 'volume-btn',
    onEnterPress: onToggleMute,
    onFocus: () => setShowSlider(true),
    onBlur: () => setShowSlider(false),
  })

  const { ref: sliderContainerRef, focused: sliderFocused } = useFocusable({
    focusKey: 'volume-slider',
    onArrowPress: (direction) => {
      if (!onVolumeChange) return false

      const volumeStep = 0.1
      if (direction === 'up') {
        const newVolume = Math.min(1, volume + volumeStep)
        onVolumeChange(newVolume)
        return true
      } else if (direction === 'down') {
        const newVolume = Math.max(0, volume - volumeStep)
        onVolumeChange(newVolume)
        return true
      }
      return false
    },
  })

  // Handle click on volume slider
  const handleSliderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current || !onVolumeChange) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onVolumeChange(percent)
  }, [onVolumeChange])

  const muteButtonClasses = [
    'w-10',
    'h-10',
    'flex',
    'items-center',
    'justify-center',
    'rounded-lg',
    'transition-all',
    'duration-150',
    buttonFocused ? 'bg-tv-accent scale-110' : 'bg-white/10 hover:bg-white/20',
  ].join(' ')

  const effectiveVolume = isMuted ? 0 : volumePercent

  return (
    <div
      className="flex items-center gap-2"
      data-testid={testId}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => !sliderFocused && setShowSlider(false)}
    >
      {/* Mute Button */}
      <button
        ref={buttonRef}
        className={muteButtonClasses}
        onClick={onToggleMute}
        data-testid={testId ? `${testId}-mute` : undefined}
        data-focused={buttonFocused}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <VolumeOffIcon />
        ) : volume < 0.5 ? (
          <VolumeLowIcon />
        ) : (
          <VolumeHighIcon />
        )}
      </button>

      {/* Volume Slider */}
      <div
        ref={sliderContainerRef}
        className={[
          'overflow-hidden',
          'transition-all',
          'duration-200',
          showSlider || sliderFocused ? 'w-24 opacity-100' : 'w-0 opacity-0',
        ].join(' ')}
      >
        <div
          ref={sliderRef}
          className={[
            'relative',
            'w-24',
            'h-8',
            'flex',
            'items-center',
            'cursor-pointer',
          ].join(' ')}
          onClick={handleSliderClick}
          data-testid={testId ? `${testId}-slider` : undefined}
          data-focused={sliderFocused}
        >
          <div className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-tv-accent rounded-full"
              style={{ width: `${effectiveVolume}%` }}
            />
          </div>

          {/* Volume Handle */}
          <div
            className={[
              'absolute',
              'top-1/2',
              '-translate-y-1/2',
              '-translate-x-1/2',
              'w-3',
              'h-3',
              'bg-white',
              'rounded-full',
              'shadow-md',
              'transition-transform',
              sliderFocused ? 'scale-125' : '',
            ].join(' ')}
            style={{ left: `${effectiveVolume}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Icons
// ============================================================================

function PlayIcon() {
  return (
    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function VolumeHighIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}

function VolumeLowIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  )
}

function VolumeOffIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  )
}
